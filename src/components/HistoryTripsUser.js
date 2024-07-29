import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Container, Row, Col, Card, Pagination, Dropdown } from 'react-bootstrap';
import { CarFront, BoxSeam, CheckCircle, XCircle, HourglassSplit } from 'react-bootstrap-icons';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import Navbar from './Navbar';

const HistoryTripsUser = () => {
  const { id_usuario } = useParams();
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('today');
  const [statusFilter, setStatusFilter] = useState('');
  const [totalTrips, setTotalTrips] = useState(0);
  const [acceptedTrips, setAcceptedTrips] = useState(0);
  const [cancelledTrips, setCancelledTrips] = useState(0);
  const [finishedTrips, setFinishedTrips] = useState(0);
  const tripsPerPage = 10;

  const fetchTrips = async () => {
    try {
      console.log(`Consultando historial de viajes para ${id_usuario}`);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/geolocation/history/${id_usuario}`);
      setTrips(response.data);
      applyFilters(response.data);
    } catch (error) {
      console.error('Error al obtener el historial de viajes:', error);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [id_usuario]);

  useEffect(() => {
    applyFilters(trips);
  }, [filter, statusFilter, page]);

  const applyFilters = (allTrips) => {
    let filtered = allTrips;

    // Apply date filter
    const now = new Date();
    if (filter === 'today') {
      filtered = filtered.filter(trip => new Date(trip.fecha_hora_inicio).toDateString() === now.toDateString());
    } else if (filter === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      filtered = filtered.filter(trip => new Date(trip.fecha_hora_inicio).toDateString() === yesterday.toDateString());
    } else if (filter === 'week') {
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      filtered = filtered.filter(trip => new Date(trip.fecha_hora_inicio) >= weekStart);
    } else if (filter === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = filtered.filter(trip => new Date(trip.fecha_hora_inicio) >= monthStart);
    } else if (filter === 'year') {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      filtered = filtered.filter(trip => new Date(trip.fecha_hora_inicio) >= yearStart);
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(trip => trip.estado === statusFilter);
    }

    setFilteredTrips(filtered);
    setTotalTrips(filtered.length);

    // Update counters
    const accepted = filtered.filter(trip => trip.estado === 'aceptado').length;
    const cancelled = filtered.filter(trip => trip.estado === 'cancelado').length;
    const finished = filtered.filter(trip => trip.estado === 'finalizado').length;
    setAcceptedTrips(accepted);
    setCancelledTrips(cancelled);
    setFinishedTrips(finished);
  };

  const handleFilterChange = (filterValue) => {
    setFilter(filterValue);
    setPage(1); // Reset pagination when filter changes
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setPage(1); // Reset pagination when status filter changes
  };

  const renderTripCard = (trip) => {
    let statusColor;
    if (trip.estado === 'aceptado' || trip.estado === 'esperando' || trip.estado === 'en viaje') {
      statusColor = 'blue';
    } else if (trip.estado === 'cancelado') {
      statusColor = 'red';
    } else if (trip.estado === 'finalizado') {
      statusColor = 'green';
    }

    return (
      <Card key={trip.id_viaje} className="mb-3">
        <Card.Body>
          <Card.Title>
            {trip.tipo === 'taxi' ? <CarFront /> : <BoxSeam />} {trip.descripcion}
          </Card.Title>
          <Card.Text>De: {trip.direccion}</Card.Text>
          <Card.Text>Hasta: {trip.direccion_fin}</Card.Text>
          {trip.tipo === 'delivery' && <Card.Text>Descripción: {trip.descripcion}</Card.Text>}
          <Card.Text>Fecha de inicio: {trip.fecha_hora_inicio}</Card.Text>
          <Card.Text style={{ color: statusColor }}>Estado: {trip.estado}</Card.Text>
        </Card.Body>
      </Card>
    );
  };

  const getLabelsForGraph = () => {
    const labels = [];
    const labelSet = new Set();

    filteredTrips.forEach(trip => {
      const date = new Date(trip.fecha_hora_inicio);
      if (filter === 'today' || filter === 'yesterday') {
        labelSet.add(date.getHours());
      } else if (filter === 'week' || filter === 'month') {
        labelSet.add(date.getDate());
      } else if (filter === 'year') {
        labelSet.add(date.getMonth() + 1);
      }
    });

    return Array.from(labelSet).sort((a, b) => a - b);
  };

  const getCountByHour = (status) => {
    const counts = new Array(24).fill(0);
    filteredTrips.filter(trip => trip.estado === status).forEach(trip => {
      counts[new Date(trip.fecha_hora_inicio).getHours()]++;
    });
    return counts;
  };

  const getCountByDay = (status) => {
    const dayMap = {};
    filteredTrips.filter(trip => trip.estado === status).forEach(trip => {
      const day = new Date(trip.fecha_hora_inicio).getDate();
      dayMap[day] = (dayMap[day] || 0) + 1;
    });
    return Object.values(dayMap);
  };

  const getCountByMonth = (status) => {
    const monthMap = {};
    filteredTrips.filter(trip => trip.estado === status).forEach(trip => {
      const month = new Date(trip.fecha_hora_inicio).getMonth() + 1;
      monthMap[month] = (monthMap[month] || 0) + 1;
    });
    return Object.values(monthMap);
  };

  const getDataForGraph = (status) => {
    if (filter === 'today' || filter === 'yesterday') {
      return getCountByHour(status);
    } else if (filter === 'week' || filter === 'month') {
      return getCountByDay(status);
    } else if (filter === 'year') {
      return getCountByMonth(status);
    }
  };

  const data = {
    labels: getLabelsForGraph(),
    datasets: [
      {
        label: 'Viajes Finalizados',
        data: getDataForGraph('finalizado'),
        fill: false,
        backgroundColor: 'green',
        borderColor: 'green',
      },
      {
        label: 'Viajes Cancelados',
        data: getDataForGraph('cancelado'),
        fill: false,
        backgroundColor: 'red',
        borderColor: 'red',
      },
    ],
  };

  return (
    <div>
      <Navbar />
      <Container className='contenido'>
        <Row className="text-center mb-2">
          <Col>
            <Card>
              <Card.Body>
                <HourglassSplit size={30} color="blue" />
                <Card.Title>{acceptedTrips}</Card.Title>
                <Card.Text>Viajes Aceptados</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col>
            <Card>
              <Card.Body>
                <XCircle size={30} color="red" />
                <Card.Title>{cancelledTrips}</Card.Title>
                <Card.Text>Viajes Cancelados</Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col>
            <Card>
              <Card.Body>
                <CheckCircle size={30} color="green" />
                <Card.Title>{finishedTrips}</Card.Title>
                <Card.Text>Viajes Finalizados</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        <Row className="mb-2 text-right">
          <Col>
            <h3 className='mt-3'>Historial de viajes</h3>
          </Col>
          <Col>
            <Dropdown onSelect={handleFilterChange}>
              <Dropdown.Toggle variant="black btn-sm" id="dropdown-basic">
                Filtro de fecha
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item eventKey="today">Hoy</Dropdown.Item>
                <Dropdown.Item eventKey="yesterday">Ayer</Dropdown.Item>
                <Dropdown.Item eventKey="week">Esta Semana</Dropdown.Item>
                <Dropdown.Item eventKey="month">Este Mes</Dropdown.Item>
                <Dropdown.Item eventKey="year">Este Año</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <Dropdown onSelect={handleStatusFilterChange}>
              <Dropdown.Toggle variant="black btn-sm" id="dropdown-status">
                Filtro de Estado
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item eventKey="">Todos</Dropdown.Item>
                <Dropdown.Item eventKey="aceptado">Aceptados</Dropdown.Item>
                <Dropdown.Item eventKey="cancelado">Cancelados</Dropdown.Item>
                <Dropdown.Item eventKey="finalizado">Finalizados</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Col>
        </Row>
        <Row>
          {filteredTrips.slice((page - 1) * tripsPerPage, page * tripsPerPage).map(trip => (
            <Col md={4} key={trip.id_viaje}>
              {renderTripCard(trip)}
            </Col>
          ))}
        </Row>
        <Row className="my-3 justify-content-center">
          <Col className="text-center">
            <Pagination className="justify-content-center">
              <Pagination.Prev onClick={() => setPage(page > 1 ? page - 1 : 1)} />
              {[...Array(Math.ceil(totalTrips / tripsPerPage)).keys()].map(num => (
                <Pagination.Item key={num + 1} active={num + 1 === page} onClick={() => setPage(num + 1)}>
                  {num + 1}
                </Pagination.Item>
              ))}
              <Pagination.Next onClick={() => setPage(page < Math.ceil(totalTrips / tripsPerPage) ? page + 1 : page)} />
            </Pagination>
          </Col>
        </Row>
        <Row>
          <Col>
            <Line data={data} />
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default HistoryTripsUser;
