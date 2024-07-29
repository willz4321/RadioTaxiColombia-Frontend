import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { Person, People, ChatDots, Calendar, FileText } from 'react-bootstrap-icons';
import LogoutButton from './LogoutButton';
import { Modal, Button, Form } from 'react-bootstrap';
import Navbar from './Navbar';

function UserPage() {
    const [user, setUser] = useState({
        nombre: "",
        id_usuario: "",
        telefono: "",
        navegacion: "Google Maps",
        placa: "",
        tipo: "",
        foto: null,
        password: ""
    });
    const [showModal, setShowModal] = useState(false);
    const tipoUsuario = localStorage.getItem('tipo_usuario');

    useEffect(() => {
        const fetchUserData = async () => {
            const id_usuario = localStorage.getItem('id_usuario');
            if (id_usuario) {
                try {
                    const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/user/${id_usuario}`);
                    if (response.data) {
                        setUser({
                            ...response.data,
                            foto: response.data.foto || null,
                            password: "" // Clear the password field
                        });
                    }
                } catch (error) {
                    console.error('Error al obtener los datos del usuario:', error);
                    setUser(prevState => ({
                        ...prevState,
                        error: 'No se pudo cargar la información del usuario'
                    }));
                }
            }
        };

        fetchUserData();
    }, []);

    const handleEdit = () => {
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/auth/user/${user.id_usuario}`, user);
            setUser(response.data);
            setShowModal(false);
        } catch (error) {
            console.error('Error al actualizar el usuario:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUser(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const backButtonStyle = {
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        zIndex: 1000
    };

    return (
        <div className="container-fluid contenido">
            <Navbar />
            <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '5px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: '#fff' }}>
                <h1 style={{ textAlign: 'center', color: '#333' }}>Información de {user.nombre}</h1>
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    {user.foto && <img src={`${process.env.REACT_APP_API_URL}/${user.foto}`} alt="Foto del usuario" style={{ width: '150px', height: '150px', borderRadius: '75px', objectFit: 'cover', marginBottom: '20px' }} />}
                </div>
                <div style={{ margin: '20px 0', padding: '10px', borderBottom: '1px solid #eee' }}>
                    <strong>Nombre:</strong> {user.nombre}
                    <br />
                    <strong>Cédula:</strong> {user.id_usuario}
                    <br />
                    <strong>Teléfono:</strong> {user.telefono}
                    <br />
                    <strong>Placa:</strong> {user.placa}
                    <br />
                    <strong>Sistema de Navegación:</strong> {user.navegacion}
                </div>
                <Button variant="warning" onClick={handleEdit}>Editar</Button>
                <div style={backButtonStyle}>
                    <Link to="/home" className="btn btn-secondary">
                        <FontAwesomeIcon icon={faArrowLeft} size="lg" />
                    </Link>
                </div>
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Editar Información</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group controlId="telefono">
                            <Form.Label>Teléfono:</Form.Label>
                            <Form.Control
                                type="text"
                                name="telefono"
                                value={user.telefono}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>
                        <Form.Group controlId="password">
                            <Form.Label>Nueva Contraseña:</Form.Label>
                            <Form.Control
                                type="password"
                                name="password"
                                onChange={handleChange}
                            />
                        </Form.Group>
                        <Form.Group controlId="navegacion">
                            <Form.Label>Sistema de Navegación:</Form.Label>
                            <Form.Control
                                as="select"
                                name="navegacion"
                                value={user.navegacion}
                                onChange={handleChange}
                                required
                            >
                                <option value="Google Maps">Google Maps</option>
                                <option value="Waze">Waze</option>
                            </Form.Control>
                        </Form.Group>
                        <br />
                        <Button variant="warning" type="submit" className="mr-2">Guardar</Button>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default UserPage;
