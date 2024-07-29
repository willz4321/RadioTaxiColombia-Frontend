import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Select, { components } from 'react-select';
import countryData from './CountryData';
import Flag from 'react-world-flags';
import citiesByCountry from './CitiesByCountry';

const DeliveryRequestForm = () => {
  const initialState = {
    phoneCountry: { label: '57', value: '57', flag: 'CO' },
    number: '',
    name: '',
    message: '',
    contacts: [],
    pickup: {
      country: { label: 'Colombia', value: 'CO', flag: 'CO' },
      city: 'Ipiales',
      address: '',
      userAddresses: []
    },
    delivery: {
      country: { label: 'Colombia', value: 'CO', flag: 'CO' },
      city: 'Ipiales',
      address: '',
      userAddresses: []
    }
  };

  const [state, setState] = useState(initialState);

  const handleRequestDelivery = async (e) => {
    e.preventDefault();

    const clientId = state.phoneCountry.value + state.number;
    const fullPickupAddress = `${state.pickup.address}, ${state.pickup.city}, ${state.pickup.country.label}`;
    const fullDeliveryAddress = `${state.delivery.address}, ${state.delivery.city}, ${state.delivery.country.label}`;

    try {
      const pickupCoords = await getCoordinates(fullPickupAddress);
      const deliveryCoords = await getCoordinates(fullDeliveryAddress);

      const deliveryRequestData = {
        clientId,
        name: state.name,
        latitude: pickupCoords.lat,
        longitude: pickupCoords.lng,
        pickupAddress: fullPickupAddress,
        deliveryLatitude: deliveryCoords.lat,
        deliveryLongitude: deliveryCoords.lng,
        deliveryAddress: fullDeliveryAddress,
        description: state.description
      };

      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/geolocation/delivery-request`, deliveryRequestData);
      setState(prevState => ({ ...prevState, message: 'Solicitud de domicilio enviada exitosamente.' }));
      console.log('Respuesta de la solicitud de domicilio:', response.data);
      handleReset();
    } catch (error) {
      setState(prevState => ({ ...prevState, message: 'Error al solicitar el domicilio.' }));
      console.error('Error al solicitar el domicilio:', error);
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
      if (type === 'pickup') {
        setState(prevState => ({
          ...prevState,
          pickup: {
            ...prevState.pickup,
            userAddresses: response.data.map(address => ({
              label: address,
              value: address,
              shortAddress: address
            }))
          }
        }));
      } else if (type === 'delivery') {
        setState(prevState => ({
          ...prevState,
          delivery: {
            ...prevState.delivery,
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
      loadUserAddresses(state.phoneCountry.value + phoneNumber, 'pickup');
      loadUserAddresses(state.phoneCountry.value + phoneNumber, 'delivery');
    }
  };

  const handleAddressChange = (selectedOption, type) => {
    if (selectedOption) {
      const addressParts = selectedOption.value.split(', ');
      const address = addressParts[0];
      const city = addressParts[1];
      const countryLabel = addressParts[2];

      if (type === 'pickup') {
        const pickupCountry = countryData.find(c => c.name === countryLabel);
        setState(prevState => ({
          ...prevState,
          pickup: {
            ...prevState.pickup,
            address,
            city,
            country: { label: countryLabel, value: pickupCountry.code, flag: pickupCountry.flag }
          }
        }));
      } else if (type === 'delivery') {
        const deliveryCountry = countryData.find(c => c.name === countryLabel);
        setState(prevState => ({
          ...prevState,
          delivery: {
            ...prevState.delivery,
            address,
            city,
            country: { label: countryLabel, value: deliveryCountry.code, flag: deliveryCountry.flag }
          }
        }));
      }
    }
  };

  const handleAddressInputChange = (newValue, { action }, type) => {
    if (action === 'input-change' || action === 'set-value') {
      if (type === 'pickup') {
        setState(prevState => ({
          ...prevState,
          pickup: {
            ...prevState.pickup,
            address: newValue
          }
        }));
      } else if (type === 'delivery') {
        setState(prevState => ({
          ...prevState,
          delivery: {
            ...prevState.delivery,
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

  const pickupCityOptions = citiesByCountry[state.pickup.country.value]?.map((city) => ({ label: city, value: city })) || [];
  const deliveryCityOptions = citiesByCountry[state.delivery.country.value]?.map((city) => ({ label: city, value: city })) || [];

  const customSingleValueFlagOnly = ({ data }) => (
    <Flag code={data.flag} style={{ width: 20 }} />
  );

  const NoClearIndicator = (props) => (
    components.DropdownIndicator && <components.DropdownIndicator {...props} />
  );

  const isFormFilled = () => {
    return state.number || state.name || state.pickup.address || state.delivery.address;
  };

  return (
    <div className="card">
      <div className="card-body">
        <h2 className="card-title">Solicitud de Domicilio</h2>
        {state.message && <p className="alert alert-info">{state.message}</p>}
        <form onSubmit={handleRequestDelivery}>
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
              <label>Dirección de Recogida:</label>
              <Select
                options={state.pickup.userAddresses}
                onChange={(selected) => handleAddressChange(selected, 'pickup')}
                onInputChange={(newValue, actionMeta) => handleAddressInputChange(newValue, actionMeta, 'pickup')}
                className="form-control p-0"
                classNamePrefix="select"
                styles={customStyles}
                inputValue={state.pickup.address}
                isClearable
                getOptionLabel={option => option.label}
                components={{ ClearIndicator: null }}
                value={state.pickup.address ? { label: state.pickup.address, value: state.pickup.address } : null}
              />
            </div>
            <div className="form-group col-md-4">
              <label>Ciudad:</label>
              <Select
                options={pickupCityOptions}
                value={{ label: state.pickup.city, value: state.pickup.city }}
                onChange={(selected) => setState(prevState => ({
                  ...prevState,
                  pickup: {
                    ...prevState.pickup,
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
                value={state.pickup.country}
                onChange={selected => setState(prevState => ({
                  ...prevState,
                  pickup: {
                    ...prevState.pickup,
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
              <label>Dirección de Entrega:</label>
              <Select
                options={state.delivery.userAddresses}
                onChange={(selected) => handleAddressChange(selected, 'delivery')}
                onInputChange={(newValue, actionMeta) => handleAddressInputChange(newValue, actionMeta, 'delivery')}
                className="form-control p-0"
                classNamePrefix="select"
                styles={customStyles}
                inputValue={state.delivery.address}
                isClearable
                getOptionLabel={option => option.label}
                components={{ ClearIndicator: null }}
                value={state.delivery.address ? { label: state.delivery.address, value: state.delivery.address } : null}
              />
            </div>
            <div className="form-group col-md-4">
              <label>Ciudad:</label>
              <Select
                options={deliveryCityOptions}
                value={{ label: state.delivery.city, value: state.delivery.city }}
                onChange={(selected) => setState(prevState => ({
                  ...prevState,
                  delivery: {
                    ...prevState.delivery,
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
                value={state.delivery.country}
                onChange={selected => setState(prevState => ({
                  ...prevState,
                  delivery: {
                    ...prevState.delivery,
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
          <div className="form-group">
            <label>Descripción del Domicilio:</label>
            <textarea
              className="form-control"
              value={state.description}
              onChange={(e) => setState(prevState => ({ ...prevState, description: e.target.value }))}
              required
              style={{ fontSize: '0.9em' }}
              rows="3"
            />
          </div>
          <br />
          <button type="submit" className="btn btn-warning btn-block" style={{ fontSize: '0.9em' }}>
            Solicitar Domicilio
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

export default DeliveryRequestForm;
