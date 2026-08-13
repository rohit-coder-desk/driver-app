import { orderApi } from '../api/order.api';

export interface OrderLocation {
  address: string;
  lat: number;
  lng: number;
  contactName?: string;
  contactPhone?: string;
  houseNo?: string;
  floor?: string;
  locality?: string;
  tag?: string;
}

export interface OrderData {
  id: number;
  code?: string;
  status: string;
  customerName?: string;
  customerPhone?: string;
  pickup: OrderLocation;
  dropoff: OrderLocation;
  price?: number;
  calculatedPrice?: number;
  estimatedDistance?: number | string;
  cancellationReason?: string;
  failedReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkingTypeVisibilityConfig {
  showPrice?: boolean;
  showWallet?: boolean;
  showEarning?: boolean;
  showOrderTypeLabel?: boolean;
  showPaymentInstruction?: boolean;
  canCancelOrder?: boolean;
  showOrdersTab?: boolean;
  showRouteTab?: boolean;
  showBalanceTab?: boolean;
  showTransactionsTab?: boolean;
}

export interface OrderOfferData {
  id: number; // offer id
  orderId: number;
  status: string;
  expiresAt?: string;
  order: OrderData;
  workingTypeConfig?: WorkingTypeVisibilityConfig;
}

export const parseLocation = (loc: any, isPickup?: boolean): OrderLocation => {
  if (!loc) {
    return { address: 'Unknown Location', lat: 0, lng: 0 };
  }
  if (typeof loc === 'string') {
    try {
      loc = JSON.parse(loc);
    } catch (e) {
      return { address: loc, lat: 0, lng: 0 };
    }
  }

  const targetObj = loc.location || loc;
  let rawLat = loc.lat ?? loc.latitude ?? targetObj.lat ?? targetObj.latitude ?? 0;
  let rawLng = loc.lng ?? loc.longitude ?? targetObj.lng ?? targetObj.longitude ?? 0;

  if ((!rawLat || !rawLng) && loc.coordinates) {
    if (typeof loc.coordinates === 'object' && !Array.isArray(loc.coordinates)) {
      rawLat = loc.coordinates.lat ?? loc.coordinates.latitude ?? rawLat;
      rawLng = loc.coordinates.lng ?? loc.coordinates.longitude ?? rawLng;
    } else if (Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
      const first = Number(loc.coordinates[0]);
      const second = Number(loc.coordinates[1]);
      if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
        rawLat = first;
        rawLng = second;
      } else {
        rawLng = first;
        rawLat = second;
      }
    }
  }

  const lat = Number(rawLat) || 0;
  const lng = Number(rawLng) || 0;

  const result: OrderLocation = {
    address: loc.address || loc.formattedAddress || 'Selected Location',
    lat,
    lng,
    contactName: loc.contactName || loc.name || loc.details?.deliveryDetails?.deliveryName,
    contactPhone: loc.contactPhone || loc.phone || loc.details?.deliveryDetails?.deliveryPhone,
    houseNo: loc.houseNo || loc.details?.houseNo,
    floor: loc.floor || loc.details?.floor,
    locality: loc.locality || loc.details?.locality,
    tag: loc.tag || loc.details?.tag,
  };

  console.log(`[STAGE-6] [PARSED-LOCATION] ${isPickup ? 'Pickup' : 'Dropoff'} (${lat}, ${lng}) - Address: '${result.address}'`);
  return result;
};

export const OrderService = {
  getDriverOffers: async (): Promise<OrderOfferData[]> => {
    try {
      const response = await orderApi.getOffers();
      const rawList = response.data || [];
      return rawList.map((item: any) => ({
        ...item,
        order: {
          ...item.order,
          pickup: parseLocation(item.order?.pickup, true),
          dropoff: parseLocation(item.order?.dropoff, false),
        },
      }));
    } catch (error: any) {
      console.warn('Error getting driver offers:', error);
      return [];
    }
  },

  acceptOffer: async (offerId: number) => {
    try {
      const response = await orderApi.acceptOffer(offerId);
      return response.data;
    } catch (error: any) {
      throw error.response?.data?.message || 'Failed to accept offer.';
    }
  },

  rejectOffer: async (offerId: number) => {
    try {
      const response = await orderApi.rejectOffer(offerId);
      return response.data;
    } catch (error: any) {
      throw error.response?.data?.message || 'Failed to reject offer.';
    }
  },

  getDriverOrders: async (driverId: number): Promise<OrderData[]> => {
    try {
      const response = await orderApi.getOrders();
      const rawOrders = response.data?.orders || response.data || [];
      const driverOrders = Array.isArray(rawOrders)
        ? rawOrders.filter((order: any) => Number(order.driverId) === Number(driverId))
        : [];

      return driverOrders.map((order: any) => ({
        ...order,
        pickup: parseLocation(order.pickup, true),
        dropoff: parseLocation(order.dropoff, false),
      }));
    } catch (error: any) {
      console.warn('Error getting driver orders:', error);
      return [];
    }
  },

  getActiveOrderForDriver: async (driverId: number): Promise<OrderData | null> => {
    try {
      const response = await orderApi.getOrders();
      const rawOrders = response.data?.orders || response.data || [];
      console.log(`[STAGE-5] [DRIVERAPP-RECEIVED-API-RESPONSE] Raw Orders:`, JSON.stringify(Array.isArray(rawOrders) ? rawOrders.map((o: any) => ({ id: o.id, status: o.status, driverId: o.driverId, pickup: o.pickup, dropoff: o.dropoff })) : rawOrders));
      
      const activeStatuses = [
        'accepted',
        'assigned',
        'reached_pickup',
        'arrived',
        'picked_up',
        'on_the_way',
        'near_destination',
        'reached_dropoff'
      ];
      
      const active = Array.isArray(rawOrders) ? rawOrders.find((o: any) => {
        const matchesDriver = Number(o.driverId) === Number(driverId);
        const isActive = activeStatuses.includes(String(o.status).toLowerCase());
        if (matchesDriver) {
          console.log(`[ORDER-DEBUG] Driver Order Found #${o.id} - Status: '${o.status}' (IsActive: ${isActive})`);
        }
        return matchesDriver && isActive;
      }) : null;

      if (!active) {
        console.log(`[ORDER-DEBUG] No active order matching driverId ${driverId} in active statuses.`);
        return null;
      }

      const parsedOrder = {
        ...active,
        pickup: parseLocation(active.pickup, true),
        dropoff: parseLocation(active.dropoff, false),
      };

      console.log(`[ORDER-DEBUG] [ACTIVE-ORDER-LOADED] #${parsedOrder.id} - Pickup Coords: (${parsedOrder.pickup?.lat}, ${parsedOrder.pickup?.lng}), Dropoff Coords: (${parsedOrder.dropoff?.lat}, ${parsedOrder.dropoff?.lng})`);
      return parsedOrder;
    } catch (error: any) {
      console.warn('[ORDER-DEBUG] Error checking active order:', error);
      return null;
    }
  },

  updateOrderStatus: async (orderId: number, status: string, paymentMethod?: string) => {
    try {
      const response = await orderApi.updateOrderStatus(orderId, status, paymentMethod);
      return response.data;
    } catch (error: any) {
      throw error.response?.data?.message || 'Failed to update order status.';
    }
  },

  cancelOrder: async (orderId: number, reason: string) => {
    try {
      const response = await orderApi.cancelOrder(orderId, reason);
      return response.data;
    } catch (error: any) {
      throw error.response?.data?.message || 'Failed to cancel order.';
    }
  },

  getFailureReasons: async () => {
    try {
      const response = await orderApi.getFailureReasons();
      return response.data || [];
    } catch (error: any) {
      console.warn('Error fetching failure reasons:', error);
      return [];
    }
  },

  rateCustomer: async (orderId: number, rating: number, review?: string) => {
    try {
      const response = await orderApi.rateCustomer(orderId, rating, review);
      return response.data;
    } catch (error: any) {
      console.warn('Error rating customer:', error);
      throw error.response?.data?.message || 'Failed to rate customer.';
    }
  },
};

