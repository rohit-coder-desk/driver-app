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
  createdAt?: string;
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

export const parseLocation = (loc: any): OrderLocation => {
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
  return {
    address: loc.address || loc.formattedAddress || 'Selected Location',
    lat: Number(loc.lat || loc.latitude || 0),
    lng: Number(loc.lng || loc.longitude || 0),
    contactName: loc.contactName || loc.name || loc.details?.deliveryDetails?.deliveryName,
    contactPhone: loc.contactPhone || loc.phone || loc.details?.deliveryDetails?.deliveryPhone,
    houseNo: loc.houseNo || loc.details?.houseNo,
    floor: loc.floor || loc.details?.floor,
    locality: loc.locality || loc.details?.locality,
    tag: loc.tag || loc.details?.tag,
  };
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
          pickup: parseLocation(item.order?.pickup),
          dropoff: parseLocation(item.order?.dropoff),
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

  getActiveOrderForDriver: async (driverId: number): Promise<OrderData | null> => {
    try {
      const response = await orderApi.getOrders();
      const rawOrders = response.data?.orders || response.data || [];
      const activeStatuses = ['assigned', 'arrived', 'picked_up', 'near_destination'];
      
      const active = rawOrders.find((o: any) => {
        const matchesDriver = Number(o.driverId) === Number(driverId);
        const isActive = activeStatuses.includes(o.status);
        return matchesDriver && isActive;
      });

      if (!active) return null;

      return {
        ...active,
        pickup: parseLocation(active.pickup),
        dropoff: parseLocation(active.dropoff),
      };
    } catch (error: any) {
      console.warn('Error checking active order:', error);
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

