import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-toastify";
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
	const [hasBackendConnection, setHasBackendConnection] = useState(
		() => globalThis.frappe?.realtime?.socket?.connected ?? true
	);
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

	const playNotificationSound = () => {
		if (!audioPlayer.current) return;
		audioPlayer.current.currentTime = 0;
		audioPlayer.current.play().catch((err) => {
			console.warn(
				"🔇 Audio blocked. Click anywhere on the screen to enable sounds.",
				err
			);
		});
	};

	// Adds/updates an order card from either a KOT payload or a raw Sales Order payload
	const upsertOrder = (raw) => {
		setOrders((prev) => {
			const exists = prev.some((o) => o.name === raw.name);

			const updatedOrder = withCookingTimer({
				...raw,
				custom_payment_method: raw.custom_payment_method,
				custom_payment_status: raw.custom_payment_status,
				created_ts: raw.creation ? new Date(raw.creation).getTime() : Date.now(),
			});

			if (exists) {
				// This block now swaps out data for already existing array items reactively
				return prev.map((o) => (o.name === raw.name ? updatedOrder : o));
			}
			return [updatedOrder, ...prev];
		});
	};

	// Online orders no longer create a KOT server-side; they arrive as a raw Sales Order dict
	const normaliseSalesOrderEvent = (so) => ({
		name: so.name,
		sales_order: so.name,
		status: "Pending",
		customer: so.customer_name || so.customer,
		order_type: so.order_type,
		custom_payment_method: so.custom_payment_method,
		custom_payment_status: so.custom_payment_status,
		creation: so.creation,
		items: (so.items || []).map((item) => ({
			item_code: item.item_code,
			item_name: item.item_name || item.item_code,
			qty: item.qty,
			description: item.description,
		})),
	});

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
		});
	}, []);

	useEffect(() => {
		// 1. Initial Fetch of existing KOTs (defaults to today's range on the server)
		fetchOrders();

		// 2. Real-time listener for in-store orders (KOT already created server-side)
		globalThis.frappe.realtime.on("new_kot", (msg) => {
			console.log("🔔 New KOT received:", msg);
			playNotificationSound();
			toast.info(`New order: ${msg.name}`);
			upsertOrder(msg);
		});

		// 3. Real-time listener for online/doorstep orders (raw Sales Order, no KOT yet)
		globalThis.frappe.realtime.on("new order", (msg) => {
			console.log("🔔 New online order received:", msg);
			playNotificationSound();
			toast.info(`New online order: ${msg.name}`);
			upsertOrder(normaliseSalesOrderEvent(msg));
		});

		// 4. Real-time listener for print broadcasts sent to the local print agent
		globalThis.frappe.realtime.on("print_job", (msg) => {
			console.log("🖨️ Print job event received:", msg);
			playNotificationSound();
			toast.info(`Print job sent for order: ${msg.name}`);
		});

		// Cleanup socket listeners on unmount
		return () => {
			globalThis.frappe.realtime.off("new_kot");
			globalThis.frappe.realtime.off("new order");
			globalThis.frappe.realtime.off("print_job");
		};
	}, [fetchOrders]);

	// Effect 3: Track backend reachability via the underlying socket.io connection state
	useEffect(() => {
		const socket = globalThis.frappe?.realtime?.socket;
		if (!socket) return;

		const handleConnect = () => setHasBackendConnection(true);
		const handleDisconnect = () => setHasBackendConnection(false);

		socket.on("connect", handleConnect);
		socket.on("disconnect", handleDisconnect);
		socket.on("connect_error", handleDisconnect);

		return () => {
			socket.off("connect", handleConnect);
			socket.off("disconnect", handleDisconnect);
			socket.off("connect_error", handleDisconnect);
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

			
	return { orders, bump, enableAudio, hasBackendConnection, fetchOrders };
};

