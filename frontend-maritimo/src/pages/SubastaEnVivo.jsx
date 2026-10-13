import { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export default function SubastaEnVivo() {
  const [pujaActual, setPujaActual] = useState(500); // Precio base de ejemplo
  const [miPuja, setMiPuja] = useState('');
  const [stompClient, setStompClient] = useState(null);

  useEffect(() => {
    // Configuración del cliente WebSocket (apuntando al proxy de tu vite.config.js)
    const client = new Client({
      webSocketFactory: () => new SockJS('/api/logistica/ws-subastas'), // Ajustar según la ruta exacta del backend
      onConnect: () => {
        console.log('Conectado al servidor de WebSockets');
        
        // Suscribirse al tópico para recibir pujas en tiempo real
        client.subscribe('/topic/subasta', (mensaje) => {
          if (mensaje.body) {
            const nuevaPuja = JSON.parse(mensaje.body);
            setPujaActual(nuevaPuja.monto);
          }
        });
      },
      onStompError: (frame) => {
        console.error('Error de Broker: ' + frame.headers['message']);
      },
    });

    client.activate();
    setStompClient(client);

    return () => client.deactivate(); // Limpiar conexión al desmontar el componente
  }, []);

  const enviarPuja = (e) => {
    e.preventDefault();
    if (stompClient && stompClient.connected && miPuja > pujaActual) {
      // Enviar la puja al servidor
      stompClient.publish({
        destination: '/app/Pujar',
        body: JSON.stringify({ monto: parseInt(miPuja), postor: 'Exportador1' }),
      });
      setMiPuja('');
    } else {
      alert("Tu puja debe ser mayor a la actual.");
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold mb-6">Subasta en Vivo - Buque Express</h2>
      
      <div className="p-8 text-center bg-gray-100 rounded-lg shadow-md border-2 border-blue-500 mb-8">
        <h3 className="text-xl text-gray-600 mb-2">Puja Ganadora Actual</h3>
        <p className="text-6xl font-bold text-green-600">{pujaActual} Tokens</p>
      </div>

      <form onSubmit={enviarPuja} className="flex gap-4">
        <input 
          type="number" 
          value={miPuja} 
          onChange={(e) => setMiPuja(e.target.value)}
          placeholder="Ingresa tu puja..." 
          className="flex-1 px-4 py-3 border rounded-md"
        />
        <button type="submit" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700">
          Lanzar Puja
        </button>
      </form>
    </div>
  );
}