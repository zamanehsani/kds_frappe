import { useState, useEffect, useRef, useCallback } from "react";
import notificationSound from "../assets/notification.mp3";

const normaliseStatus = (status) => status?.toLowerCase() || "pending";

// Frappe expects "YYYY-MM-DD HH:MM:SS" in local time, not an ISO string.
const toFrappeDatetime = (date) => {
	const pad = (n) => String(n).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
		date.getHours()
	)}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

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
	const [hasBackendConnection, setHasBackendConnection] = useState(true);
	const audioPlayer = useRef(null);
	const audioUnlocked = useRef(false);

	const enableAudio = async () => {
		if (!audioPlayer.current) return false;

		try {
			audioPlayer.current.currentTime = 0;
			await audioPlayer.current.play();
			audioPlayer.current.pause();
			audioPlayer.current.currentTime = 0;
			audioUnlocked.current = true;
			console.log("[KDS] Audio notifications enabled");
			return true;
		} catch (error) {
			console.warn("[KDS] Audio permission was not granted:", error);
			return false;
		}
	};

	// Effect 1: Initialize audio and unlock on first interaction
	useEffect(() => {
		// Create audio instance inside effect (not during render)
		audioPlayer.current = new Audio(notificationSound);
		audioPlayer.current.preload = "auto";

		// Unlock audio on first user interaction
		const unlockAudio = () => {
			if (!audioUnlocked.current) enableAudio();
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
	const fetchOrders = useCallback((range) => {
		const args = range
			? { start_date: toFrappeDatetime(range.start), end_date: toFrappeDatetime(range.end) }
			: {};

		console.log("[KDS] Fetching orders", args);
		globalThis.frappe.call({
			method: "pizza_app.api.get_kds_orders",
			args,
			callback: (r) => {
				console.log("[KDS] Orders response:", r);
				setHasBackendConnection(true);
				if (r.message) {
					const formatted = r.message.map((o) =>
						withCookingTimer({
							...o,
							custom_payment_method: o.custom_payment_method,
							custom_payment_status: o.custom_payment_status,
							created_ts: new Date(o.creation).getTime(),
						})
					);
					console.log("[KDS] Orders:", formatted);
					setOrders(formatted);
				}
			},
			error: () => {
				setHasBackendConnection(false);
			},
		});
	}, []);

	useEffect(() => {
		// 1. Initial Fetch of existing KOTs (defaults to today's range on the server)
		fetchOrders();

		// 2. Real-time listener for new orders
		globalThis.frappe.realtime.on("new_kot", (msg) => {
			console.log("🔔 New KOT received:", msg);
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


			setOrders((prev) => {
                const exists = prev.some((o) => o.name === msg.name);

                const updatedOrder = withCookingTimer({
                    ...msg,
                    custom_payment_method: msg.custom_payment_method,
                    custom_payment_status: msg.custom_payment_status,
                    created_ts: msg.creation ? new Date(msg.creation).getTime() : Date.now(),
                });

                if (exists) {
                    // This block now swaps out data for already existing array items reactively
                    return prev.map((o) => (o.name === msg.name ? updatedOrder : o));
                } else {
                    return [updatedOrder, ...prev];
                }
            });
		});

		// Cleanup socket listener on unmount
		return () => {
			globalThis.frappe.realtime.off("new_kot");
		};
	}, [fetchOrders]);

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

			
	return { orders, bump, enableAudio, hasBackendConnection, fetchOrders };
};

