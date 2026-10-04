import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FarmId, FarmOption, FARM_OPTIONS } from '../types/farm';
import { getDynamicFarmOptions } from '../services/farmService';

interface FarmContextType {
  selectedFarm: FarmId;
  selectedFarmOption: FarmOption;
  setFarm: (farmId: FarmId) => void;
  options: FarmOption[];
  refreshFarms: () => Promise<void>;
}

const FARM_STORAGE_KEY = '@plantation_app_selected_farm';

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedFarm, setSelectedFarm] = useState<FarmId>('namari');
  const [options, setOptions] = useState<FarmOption[]>(FARM_OPTIONS);

  const loadFarmOptions = async () => {
    try {
      const dynamicOptions = await getDynamicFarmOptions('plantation_org_namari_adukidathan');
      if (dynamicOptions && dynamicOptions.length > 0) {
        setOptions(dynamicOptions);
      }
    } catch {
      // fallback to static FARM_OPTIONS
    }
  };

  useEffect(() => {
    AsyncStorage.getItem(FARM_STORAGE_KEY)
      .then((savedFarm) => {
        if (savedFarm && (savedFarm === 'namari' || savedFarm === 'adukidathan' || savedFarm === 'consolidated')) {
          setSelectedFarm(savedFarm as FarmId);
        }
      })
      .catch((err) => console.log('Error reading selected farm from storage:', err));

    loadFarmOptions();
  }, []);

  const setFarm = (farmId: FarmId) => {
    setSelectedFarm(farmId);
    AsyncStorage.setItem(FARM_STORAGE_KEY, farmId).catch(console.error);
  };

  const selectedFarmOption = options.find((f) => f.id === selectedFarm) || options[0];

  return (
    <FarmContext.Provider
      value={{
        selectedFarm,
        selectedFarmOption,
        setFarm,
        options,
        refreshFarms: loadFarmOptions,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = (): FarmContextType => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
};
