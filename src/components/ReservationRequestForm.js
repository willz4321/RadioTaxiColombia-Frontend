import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select, { components } from 'react-select';
import countryData from './CountryData';
import Flag from 'react-world-flags';
import citiesByCountry from './CitiesByCountry';

const ReservationRequestForm = () => {
  const initialState = {
    phoneCountry: { label: '57', value: '57', flag: 'CO' },
    number: '',
    name: '',
    message: '',
    contacts: [],
    start: {
      country: { label: 'Colombia', value: 'CO', flag: 'CO' },
      city: 'Ipiales',
      address: '',
      userAddresses: []
    },
    end: {
      country: { label: 'Colombia', value: 'CO', flag: 'CO' },
      city: 'Ipiales',
      address: '',
      userAddresses: []
    },
    date: '',
    time: ''
  };

  const [state, setState] = useState(initialState);

  const handleRequestReservation = async (e) => {
    e.preventDefault();

    const clientId = state.phoneCountry.value + state.number;
    const fullStartAddress = `${state.start.address}, ${state.start.city}, ${state.start.country.label}`;
    const fullEndAddress = `${state.end.address}, ${state.end.city}, ${state.end.country.label}`;

    try {
      const startCoords = await getCoordinates(fullStartAddress);
      const endCoords = await getCoordinates(fullEndAddress);

      const reservationRequestData = {
        clientId,
        name: state.name,
        latitude: startCoords.lat,
        longitude: startCoords.lng,
        address: fullStartAddress,
        endLatitude: endCoords.lat,
        endLongitude: endCoords.lng,
        endAddress: fullEndAddress,
        fecha_reserva: state.date,
        hora_reserva: state.time
      };

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/geolocation/reservation-request`, reservationRequestData);
      setState(prevState => ({ ...prevState, message: 'Solicitud de reserva enviada exitosamente.' }));
      console.log('Respuesta de la solicitud de reserva:', response.data);
      handleReset();
    } catch (error) {
      setState(prevState => ({ ...prevState, message: 'Error al solicitar la reserva.' }));
      console.error('Error al solicitar la reserva:', error);
    }
  };

  const handleReset = () => {
    setState(initialState);
  };

  const getCoordinates = async (address) => {
    try {
      const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
        params: {
          address: address,
          key: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
        }
      });
      const { lat, lng } = response.data.results[0].geometry.location;
      return { lat, lng };
    } catch (error) {
      console.error('Error al convertir la dirección en coordenadas:', error);
      throw error;
    }
  };

  const loadContacts = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/geolocation/suggestContacts`);
      setState(prevState => ({
        ...prevState,
        contacts: response.data.map((contact) => ({
          label: `${contact.telefono} - ${contact.nombre}`,
          value: contact.telefono,
          name: contact.nombre
        }))
      }));
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const loadUserAddresses = async (userId, type) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/geolocation/suggestAddresses`, {
        params: { userId }
      });
      if (type === 'start') {
        setState(prevState => ({
          ...prevState,
          start: {
            ...prevState.start,
            userAddresses: response.data.map(address => ({
              label: address,
              value: address,
              shortAddress: address
            }))
          }
        }));
      } else if (type === 'end') {
        setState(prevState => ({
          ...prevState,
          end: {
            ...prevState.end,
            userAddresses: response.data.map(address => ({
              label: address,
              value: address,
              shortAddress: address
            }))
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
    }
  };

  const handleClientChange = (selectedOption) => {
    if (selectedOption) {
      const phoneNumber = selectedOption.value.replace(state.phoneCountry.value, '');
      setState(prevState => ({
        ...prevState,
        number: phoneNumber,
        name: selectedOption.name
      }));
      loadUserAddresses(state.phoneCountry.value + phoneNumber, 'start');
      loadUserAddresses(state.phoneCountry.value + phoneNumber, 'end');
    }
  };

  const handleAddressChange = (selectedOption, type) => {
    if (selectedOption) {
      const addressParts = selectedOption.value.split(', ');
      const address = addressParts[0];
      const city = addressParts[1];
      const countryLabel = addressParts[2];

      if (type === 'start') {
        const startCountry = countryData.find(c => c.name === countryLabel);
        setState(prevState => ({
          ...prevState,
          start: {
            ...prevState.start,
            address,
            city,
            country: { label: countryLabel, value: startCountry.code, flag: startCountry.flag }
          }
        }));
      } else if (type === 'end') {
        const endCountry = countryData.find(c => c.name === countryLabel);
        setState(prevState => ({
          ...prevState,
          end: {
            ...prevState.end,
            address,
            city,
            country: { label: countryLabel, value: endCountry.code, flag: endCountry.flag }
          }
        }));
      }
    }
  };

  const handleAddressInputChange = (newValue, { action }, type) => {
    if (action === 'input-change' || action === 'set-value') {
      if (type === 'start') {
        setState(prevState => ({
          ...prevState,
          start: {
            ...prevState.start,
            address: newValue
          }
        }));
      } else if (type === 'end') {
        setState(prevState => ({
          ...prevState,
          end: {
            ...prevState.end,
            address: newValue
          }
        }));
      }
    }
  };

  const handleInputChange = (newValue, { action }) => {
    if (action === 'input-change' || action === 'set-value') {
      setState(prevState => ({ ...prevState, number: newValue }));
    }
  };

  const handleBlur = () => {
    setState(prevState => ({ ...prevState, number: state.number }));
  };

  const countryOptions = countryData.map((country) => ({
    label: `${country.name}`,
    value: country.code,
    flag: country.flag
  }));

  const phoneCountryOptions = countryData.map((country) => ({
    label: `${country.dial_code}`,
    value: country.dial_code,
    flag: country.flag
  }));

  const customSingleValue = ({ data }) => (
    <div className="custom-single-value d-flex align-items-center">
      <Flag code={data.flag} style={{ width: 20, marginRight: 10 }} />
      <span>{data.label}</span>
    </div>
  );

  const customOption = (props) => (
    <components.Option {...props}>
      <div className="d-flex align-items-center">
        <Flag code={props.data.flag} style={{ width: 20, marginRight: 10 }} />
        <span style={{ fontSize: '0.8em' }}>{props.data.label}</span>
      </div>
    </components.Option>
  );

  const customStyles = {
    control: (base) => ({
      ...base,
      minHeight: '38px',
      height: '38px',
      display: 'flex',
      alignItems: 'center',
    }),
    valueContainer: (base) => ({
      ...base,
      height: '38px',
      padding: '0 8px',
      display: 'flex',
      alignItems: 'center',
    }),
    singleValue: (base) => ({
      ...base,
      display: 'flex',
      alignItems: 'center',
      fontSize: '0.9em',
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
    }),
    indicatorsContainer: (base) => ({
      ...base,
      height: '38px',
    }),
  };

  const startCityOptions = citiesByCountry[state.start.country.value]?.map((city) => ({ label: city, value: city })) || [];
  const endCityOptions = citiesByCountry[state.end.country.value]?.map((city) => ({ label: city, value: city })) || [];

  const customSingleValueFlagOnly = ({ data }) => (
    <Flag code={data.flag} style={{ width: 20 }} />
  );

  const NoClearIndicator = (props) => (
    components.DropdownIndicator && <components.DropdownIndicator {...props} />
  );

  const isFormFilled = () => {
    return state.number || state.name || state.start.address || state.end.address;
  };

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">Solicitud de Reserva</h2>
        {state.message && <p className="alert alert-info">{state.message}</p>}
        <form onSubmit={handleRequestReservation}>
          <div className="form-group">
            <label>Celular:</label>
            <div className="input-group">
              <div className="input-group-prepend">
                <Select
                  options={phoneCountryOptions}
                  value={state.phoneCountry}
                  onChange={selected => setState(prevState => ({ ...prevState, phoneCountry: selected }))}
                  className="form-control p-0"
                  classNamePrefix="select"
                  components={{ SingleValue: customSingleValue, Option: customOption, ClearIndicator: null }}
                  styles={customStyles}
                />
              </div>
              <Select
                options={state.contacts}
                onFocus={loadContacts}
                onChange={handleClientChange}
                onInputChange={handleInputChange}
                className="form-control p-0"
                classNamePrefix="select"
                styles={customStyles}
                inputId="phone-number-input"
                components={{ ClearIndicator: null }}
                value={{ label: state.number, value: state.number }}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Nombre:</label>
            <input
              type="text"
              className="form-control"
              value={state.name}
              onChange={(e) => setState(prevState => ({ ...prevState, name: e.target.value }))}
              required
              style={{ fontSize: '0.9em' }}
            />
          </div>
          <div className="form-row">
            <div className="form-group col-md-5">
              <label>Dirección de Inicio:</label>
              <Select
                options={state.start.userAddresses}
                onChange={(selected) => handleAddressChange(selected, 'start')}
                onInputChange={(newValue, actionMeta) => handleAddressInputChange(newValue, actionMeta, 'start')}
                className="form-control p-0"
                classNamePrefix="select"
                styles={customStyles}
                inputValue={state.start.address}
                isClearable
                getOptionLabel={option => option.label}
                components={{ ClearIndicator: null }}
                value={state.start.address ? { label: state.start.address, value: state.start.address } : null}
              />
            </div>
            <div className="form-group col-md-4">
              <label>Ciudad:</label>
              <Select
                options={startCityOptions}
                value={{ label: state.start.city, value: state.start.city }}
                onChange={(selected) => setState(prevState => ({
                  ...prevState,
                  start: {
                    ...prevState.start,
                    city: selected.value
                  }
                }))}
                className="form-control p-0"
                classNamePrefix="select"
                styles={customStyles}
                components={{ ClearIndicator: null }}
              />
            </div>
            <div className="form-group col-md-3">
              <label>País:</label>
              <Select
                options={countryOptions}
                value={state.start.country}
                onChange={selected => setState(prevState => ({
                  ...prevState,
                  start: {
                    ...prevState.start,
                    country: selected
                  }
                }))}
                className="form-control p-0"
                classNamePrefix="select"
                components={{ SingleValue: customSingleValueFlagOnly, Option: customOption, ClearIndicator: null }}
                styles={customStyles}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group col-md-5">
              <label>Dirección de Destino:</label>
              <Select
                options={state.end.userAddresses}
                onChange={(selected) => handleAddressChange(selected, 'end')}
                onInputChange={(newValue, actionMeta) => handleAddressInputChange(newValue, actionMeta, 'end')}
                className="form-control p-0"
                classNamePrefix="select"
                styles={customStyles}
                inputValue={state.end.address}
                isClearable
                getOptionLabel={option => option.label}
                components={{ ClearIndicator: null }}
                value={state.end.address ? { label: state.end.address, value: state.end.address } : null}
              />
            </div>
            <div className="form-group col-md-4">
              <label>Ciudad:</label>
              <Select
                options={endCityOptions}
                value={{ label: state.end.city, value: state.end.city }}
                onChange={(selected) => setState(prevState => ({
                  ...prevState,
                  end: {
                    ...prevState.end,
                    city: selected.value
                  }
                }))}
                className="form-control p-0"
                classNamePrefix="select"
                styles={customStyles}
                components={{ ClearIndicator: null }}
              />
            </div>
            <div className="form-group col-md-3">
              <label>País:</label>
              <Select
                options={countryOptions}
                value={state.end.country}
                onChange={selected => setState(prevState => ({
                  ...prevState,
                  end: {
                    ...prevState.end,
                    country: selected
                  }
                }))}
                className="form-control p-0"
                classNamePrefix="select"
                components={{ SingleValue: customSingleValueFlagOnly, Option: customOption, ClearIndicator: null }}
                styles={customStyles}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group col-md-6">
              <label>Fecha del Viaje:</label>
              <input
                type="date"
                className="form-control"
                value={state.date}
                onChange={(e) => setState(prevState => ({ ...prevState, date: e.target.value }))}
                required
                style={{ fontSize: '0.9em' }}
              />
            </div>
            <div className="form-group col-md-6">
              <label>Hora del Viaje:</label>
              <input
                type="time"
                className="form-control"
                value={state.time}
                onChange={(e) => setState(prevState => ({ ...prevState, time: e.target.value }))}
                required
                style={{ fontSize: '0.9em' }}
              />
            </div>
          </div>
          <br />
          <button type="submit" className="btn btn-warning btn-block" style={{ fontSize: '0.9em' }}>
            Solicitar Reserva
          </button>
          <button
            type="button"
            className="btn btn-dark btn-block mt-2"
            style={{ fontSize: '0.9em' }}
            onClick={handleReset}
            disabled={!isFormFilled()}
          >
            Cancelar
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReservationRequestForm;
