import { useState, useEffect, useRef } from "react";
import notificationSound from "../assets/notification.mp3";

const normaliseStatus = (status) => status?.toLowerCase() || "pending";

const withCookingTimer = (order) => {
	const status = normaliseStatus(order.status);
	if (status === "preparing") {
		return {
			...order,
			cooking_started_ts: order.cooking_started_ts ?? Date.now(),
		};
	}

	return {
		...order,
		cooking_started_ts: order.cooking_started_ts ?? null,
	};
};

export const useKDS = () => {
	const [orders, setOrders] = useState([]);
	const audioPlayer = useRef(null);
	const audioUnlocked = useRef(false);

	// Effect 1: Initialize audio and unlock on first interaction
	useEffect(() => {
		// Create audio instance inside effect (not during render)
		audioPlayer.current = new Audio(notificationSound);
		audioPlayer.current.preload = "auto";

		// Unlock audio on first user interaction
		const unlockAudio = () => {
			if (audioPlayer.current && !audioUnlocked.current) {
				audioPlayer.current
					.play()
					.then(() => {
						audioPlayer.current.pause();
						audioPlayer.current.currentTime = 0;
						audioUnlocked.current = true;
						console.log("✓ Audio unlocked - notifications will now play");
					})
					.catch(() => {
						// Will try again on next interaction
					});
			}
		};

		globalThis.addEventListener("click", unlockAudio, { once: true });
		globalThis.addEventListener("keydown", unlockAudio, { once: true });
		globalThis.addEventListener("touchstart", unlockAudio, { once: true });

		return () => {
			globalThis.removeEventListener("click", unlockAudio);
			globalThis.removeEventListener("keydown", unlockAudio);
			globalThis.removeEventListener("touchstart", unlockAudio);
			if (audioPlayer.current) {
				audioPlayer.current.pause();
				audioPlayer.current = null;
			}
		};
	}, []);

	// Effect 2: Fetch initial orders and subscribe to realtime updates
	useEffect(() => {
		// 1. Initial Fetch of existing KOTs
		globalThis.frappe.call({
			method: "pizza_app.api.get_kds_orders",
			callback: (r) => {
				if (r.message) {
					const formatted = r.message.map((o) =>
						withCookingTimer({
							...o,
							created_ts: new Date(o.creation).getTime(),
						})
					);
					setOrders(formatted);
				}
			},
		});

		// 2. Real-time listener for new orders
		globalThis.frappe.realtime.on("new_kot", (msg) => {
			console.log("🔔 New KOT received:", msg.name);

			// --- TRIGGER SOUND IMMEDIATELY ---
			if (audioPlayer.current) {
				audioPlayer.current.currentTime = 0;
				audioPlayer.current
					.play()
					.catch((err) => {
						console.warn(
							"🔇 Audio blocked. Click anywhere on the screen to enable sounds.",
							err
						);
					});
			}

			// Update state to show the new card
			setOrders((prev) => {
				// Prevent duplicate entries
				if (prev.some((o) => o.name === msg.name)) return prev;

				const newOrder = withCookingTimer({
					...msg,
					created_ts: new Date(msg.creation).getTime(),
				});
				return [newOrder, ...prev];
			});
		});

		// Cleanup socket listener on unmount
		return () => {
			globalThis.frappe.realtime.off("new_kot");
		};
	}, []);

	// 3. Status Update Logic (The "Bump" system)
	const bump = (name) => {
		// We find the order in the current state to determine the next step in the flow
		const current = orders.find((o) => o.name === name);
		const flow = ["pending", "preparing", "ready", "completed"];
		const cur = current?.status?.toLowerCase() || "pending";
		const idx = flow.indexOf(cur);

		// Calculate the next status
		const next = idx === -1 || idx === flow.length - 1 ? null : flow[idx + 1];

		if (!next) return;

		// Capitalize for Frappe (e.g., 'preparing' -> 'Preparing')
		const payload = next.charAt(0).toUpperCase() + next.slice(1);

		globalThis.frappe.call({
			method: "pizza_app.api.update_kot_status",
			args: { name, status: payload },
			callback: () => {
				// Update local UI immediately after server confirms
				setOrders((prev) =>
					prev.map((o) => {
						if (o.name !== name) return o;

						if (next === "preparing") {
							return {
								...o,
								status: payload,
								cooking_started_ts: Date.now(),
							};
						}

						return {
							...o,
							status: payload,
						};
					})
				);
			},
		});
	};

	return { orders, bump };
};

