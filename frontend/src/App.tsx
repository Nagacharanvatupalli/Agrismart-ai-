import { useState, useEffect } from 'react';
import './i18n';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './views/HomeScreen';
import { WeatherScreen } from './views/WeatherScreen';
import { SoilScreen } from './views/SoilScreen';
import { AskAgriScreen } from './views/AskAgriScreen';
import { MyFarmScreen } from './views/MyFarmScreen';
import { AlertsScreen } from './views/AlertsScreen';
import { ClimateMapScreen } from './views/ClimateMapScreen';
import { IrrigationScreen } from './views/IrrigationScreen';
import { CropRecommendationScreen } from './views/CropRecommendationScreen';
import { InsightsScreen } from './views/InsightsScreen';
import { MyCropsScreen } from './views/MyCropsScreen';
import { SavedScreen } from './views/SavedScreen';
import { ProfileScreen } from './views/ProfileScreen';
import { LoginScreen } from './views/LoginScreen';
import { AddFarmScreen } from './views/AddFarmModalOrScreen';
import { api } from './services/api';
import type { Farm } from './services/api';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [returnTabAfterAddFarm, setReturnTabAfterAddFarm] = useState<string>('weather');
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(api.getCurrentUser());
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadFarmsData();
    }
  }, [isAuthenticated]);

  const loadFarmsData = async (preferredFarmId?: number) => {
    try {
      const data = await api.getFarms();
      setFarms(data);
      if (data.length > 0) {
        if (preferredFarmId) {
          const matched = data.find((f) => f.id === preferredFarmId);
          setSelectedFarm(matched || data[0]);
        } else {
          setSelectedFarm((prev) => {
            if (prev) {
              const stillExists = data.find((f) => f.id === prev.id);
              if (stillExists) return stillExists;
            }
            return data[0];
          });
        }
      } else {
        setSelectedFarm(null);
      }
    } catch (err) {
      console.error("Failed to load farms", err);
    }
  };

  const handleSelectFarm = (farm: Farm) => {
    setSelectedFarm(farm);
  };

  const handleOpenAddFarm = (originTab: string) => {
    setReturnTabAfterAddFarm(originTab);
    setCurrentTab('add-farm');
  };

  const handleFarmCreated = async (newFarm: Farm) => {
    await loadFarmsData(newFarm.id);
    setSelectedFarm(newFarm);
    setCurrentTab(returnTabAfterAddFarm);
  };

  const handleDeleteFarm = async (id: number) => {
    try {
      await api.deleteFarm(id);
      const updated = farms.filter((f) => f.id !== id);
      setFarms(updated);
      if (selectedFarm?.id === id) {
        setSelectedFarm(updated[0] || null);
      }
    } catch (err) {
      console.error("Delete farm failed", err);
    }
  };

  if (!isAuthenticated) {
    return (
      <LoginScreen
        onLoginComplete={(newFarms) => {
          setFarms(newFarms);
          if (newFarms.length > 0) setSelectedFarm(newFarms[0]);
          setIsAuthenticated(true);
          setCurrentTab('home');
          loadFarmsData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF5] text-[#102D20] font-sans antialiased selection:bg-green-200">
      <Header
        onOpenNotifications={() => setCurrentTab('climate-alerts')}
        onLogoClick={() => setCurrentTab('home')}
        unreadAlertsCount={1}
      />

      <main className={`max-w-md mx-auto ${currentTab === 'ask-agri' ? 'h-[calc(100dvh-116px)] overflow-hidden' : 'min-h-[calc(100vh-120px)]'}`}>
        {currentTab === 'home' && (
          <HomeScreen
            onNavigate={(route) => setCurrentTab(route)}
            selectedFarm={selectedFarm}
          />
        )}

        {currentTab === 'weather' && (
          <WeatherScreen
            farms={farms}
            selectedFarm={selectedFarm}
            onSelectFarm={handleSelectFarm}
            onAddFarm={() => handleOpenAddFarm('weather')}
            onBack={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'soil' && (
          <SoilScreen
            farms={farms}
            selectedFarm={selectedFarm}
            onSelectFarm={handleSelectFarm}
            onAddFarm={() => handleOpenAddFarm('soil')}
            onBack={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'ask-agri' && (
          <AskAgriScreen
            selectedFarm={selectedFarm}
            onBack={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'my-farm' && (
          <MyFarmScreen
            farms={farms}
            selectedFarm={selectedFarm}
            onSelectFarm={handleSelectFarm}
            onAddFarm={() => handleOpenAddFarm('my-farm')}
            onDeleteFarm={handleDeleteFarm}
          />
        )}

        {currentTab === 'add-farm' && (
          <AddFarmScreen
            onBack={() => setCurrentTab(returnTabAfterAddFarm)}
            onFarmCreated={handleFarmCreated}
          />
        )}

        {currentTab === 'climate-alerts' && (
          <AlertsScreen
            farms={farms}
            selectedFarm={selectedFarm}
            onSelectFarm={handleSelectFarm}
            onAddFarm={() => handleOpenAddFarm('climate-alerts')}
            onBack={() => setCurrentTab('home')}
            onViewMap={() => setCurrentTab('climate-map')}
          />
        )}

        {currentTab === 'climate-map' && (
          <ClimateMapScreen
            farms={farms}
            selectedFarm={selectedFarm}
            onSelectFarm={handleSelectFarm}
            onBack={() => setCurrentTab('climate-alerts')}
          />
        )}

        {currentTab === 'irrigation' && (
          <IrrigationScreen
            farms={farms}
            selectedFarm={selectedFarm}
            onSelectFarm={handleSelectFarm}
            onBack={() => setCurrentTab('home')}
          />
        )}

        {currentTab === 'crop-recommendations' && (
          <CropRecommendationScreen
            farms={farms}
            selectedFarm={selectedFarm}
            onSelectFarm={handleSelectFarm}
            onBack={() => setCurrentTab('home')}
            onNavigateToIrrigation={() => setCurrentTab('irrigation')}
          />
        )}

        {currentTab === 'farm-insights' && (
          <InsightsScreen farms={farms} onBack={() => setCurrentTab('home')} />
        )}

        {currentTab === 'my-crops' && (
          <MyCropsScreen
            farms={farms}
            onBackToHome={() => setCurrentTab('home')}
            onRefreshFarms={loadFarmsData}
          />
        )}

        {currentTab === 'saved' && <SavedScreen />}

        {currentTab === 'profile' && (
          <ProfileScreen
            onLogout={() => {
              api.logout();
              setFarms([]);
              setSelectedFarm(null);
              setIsAuthenticated(false);
            }}
          />
        )}
      </main>

      <BottomNav
        activeTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
      />
    </div>
  );
}

export default App;
