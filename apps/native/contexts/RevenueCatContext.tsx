import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { CustomerInfo, Offerings, PurchasesPackage } from 'react-native-purchases';
import Purchases from 'react-native-purchases';
import {
  initializeRevenueCat,
  getOfferings as fetchOfferings,
  purchasePackage as purchasePackageService,
  getCustomerInfo as fetchCustomerInfo,
  restorePurchases as restorePurchasesService,
  showManageSubscriptions as showManageSubscriptionsService,
} from '../services/revenuecat';

interface RevenueCatContextType {
  customerInfo: CustomerInfo | null;
  offerings: Offerings | null;
  packages: PurchasesPackage[];
  loading: boolean;
  error: string | null;
  isSubscribed: boolean;
  activeEntitlements: string[];
  fetchOfferings: () => Promise<void>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<CustomerInfo>;
  restorePurchases: () => Promise<CustomerInfo>;
  refreshCustomerInfo: () => Promise<void>;
  showManageSubscriptions: () => Promise<void>;
}

const RevenueCatContext = createContext<RevenueCatContextType | undefined>(undefined);

export const useRevenueCat = () => {
  const context = useContext(RevenueCatContext);
  if (!context) {
    throw new Error('useRevenueCat must be used within a RevenueCatProvider');
  }
  return context;
};

interface RevenueCatProviderProps {
  children: ReactNode;
}

export const RevenueCatProvider: React.FC<RevenueCatProviderProps> = ({ children }) => {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<Offerings | null>(null);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshCustomerInfo = useCallback(async () => {
    try {
      const info = await fetchCustomerInfo();
      setCustomerInfo(info);
      setError(null);
    } catch (err: any) {
      console.error('Error refreshing customer info:', err);
      setError(err.message || 'Failed to refresh customer info');
    }
  }, []);

  const fetchOfferingsHandler = useCallback(async () => {
    try {
      setLoading(true);
      const offeringsData = await fetchOfferings();
      setOfferings(offeringsData);
      
      if (offeringsData.current && offeringsData.current.availablePackages.length > 0) {
        setPackages(offeringsData.current.availablePackages);
      } else {
        setPackages([]);
      }
      setError(null);
    } catch (err: any) {
      console.error('Error fetching offerings:', err);
      setError(err.message || 'Failed to fetch offerings');
      setPackages([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const purchasePackageHandler = useCallback(async (pkg: PurchasesPackage): Promise<CustomerInfo> => {
    try {
      setLoading(true);
      const { customerInfo: newCustomerInfo } = await purchasePackageService(pkg);
      setCustomerInfo(newCustomerInfo);
      setError(null);
      return newCustomerInfo;
    } catch (err: any) {
      console.error('Error purchasing package:', err);
      setError(err.message || 'Failed to purchase package');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const restorePurchasesHandler = useCallback(async (): Promise<CustomerInfo> => {
    try {
      setLoading(true);
      const customerInfoData = await restorePurchasesService();
      setCustomerInfo(customerInfoData);
      setError(null);
      return customerInfoData;
    } catch (err: any) {
      console.error('Error restoring purchases:', err);
      setError(err.message || 'Failed to restore purchases');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const showManageSubscriptionsHandler = useCallback(async () => {
    try {
      await showManageSubscriptionsService();
    } catch (err: any) {
      console.error('Error showing manage subscriptions:', err);
      setError(err.message || 'Failed to show manage subscriptions');
      throw err;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        await initializeRevenueCat();
        
        if (isMounted) {
          await refreshCustomerInfo();
          await fetchOfferingsHandler();
        }
      } catch (err: any) {
        console.error('Error initializing RevenueCat:', err);
        if (isMounted) {
          setError(err.message || 'Failed to initialize RevenueCat');
          setLoading(false);
        }
      }
    };

    initialize();

    const customerInfoUpdateListener = (info: CustomerInfo) => {
      if (isMounted) {
        setCustomerInfo(info);
      }
    };

    Purchases.addCustomerInfoUpdateListener(customerInfoUpdateListener);

    return () => {
      isMounted = false;
      Purchases.removeCustomerInfoUpdateListener(customerInfoUpdateListener);
    };
  }, [refreshCustomerInfo, fetchOfferingsHandler]);

  const activeEntitlements = customerInfo
    ? Object.keys(customerInfo.entitlements.active)
    : [];

  const isSubscribed = activeEntitlements.length > 0;

  const value: RevenueCatContextType = {
    customerInfo,
    offerings,
    packages,
    loading,
    error,
    isSubscribed,
    activeEntitlements,
    fetchOfferings: fetchOfferingsHandler,
    purchasePackage: purchasePackageHandler,
    restorePurchases: restorePurchasesHandler,
    refreshCustomerInfo,
    showManageSubscriptions: showManageSubscriptionsHandler,
  };

  return <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>;
};




