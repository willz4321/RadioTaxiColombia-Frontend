import  React, { createContext, useState } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [state, setState] = useState({
    viaje: null,
    status: undefined,
  });

  const setViaje = (viaje) => setState((prevState) => ({ ...prevState, viaje }));
  const setStatus = (status) => setState((prevState) => ({ ...prevState, status }));


  return (
    <AppContext.Provider value={{ state, setViaje, setStatus,  }}>
      {children}
    </AppContext.Provider>
  );
};