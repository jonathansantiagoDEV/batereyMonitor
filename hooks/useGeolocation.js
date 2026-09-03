import { useState, useEffect } from 'react';

export function useGeolocation() {
  const [posicao, setPosicao] = useState(null);
  const [erro, setErro] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setErro('Geolocalização não suportada');
      setCarregando(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPosicao({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setCarregando(false);
      },
      (error) => {
        setErro('Erro ao obter localização');
        setCarregando(false);
        setPosicao({ lat: -23.5505, lng: -46.6333 });
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setPosicao({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => {},
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { posicao, erro, carregando };
}