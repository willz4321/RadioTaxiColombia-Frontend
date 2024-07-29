import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PencilSquare, Trash, Telephone, JournalText, ArrowUp, ArrowDown } from 'react-bootstrap-icons';
import axios from 'axios';
import { Modal, Button, Form } from 'react-bootstrap';
import socket from '../Socket';
import Navbar from './Navbar';
import '../home.css';
import AudioRecorderButtonSingle from './AudioRecorderButtonSingle';

function UserList() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [newUser, setNewUser] = useState({ id_usuario: '', nombre: '', tipo: '', password: '', telefono: '', movil: '', navegacion: 'google_maps', placa: '', foto: null });
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: '', direction: '' });
  const tipoUsuario = localStorage.getItem('tipo_usuario');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/auth/users`);
        setUsers(response.data);
      } catch (error) {
        console.error('There was an error!', error);
      }
    };

    fetchUsers();

    socket.on('userUpdate', fetchUsers);

    return () => {
      socket.off('userUpdate', fetchUsers);
    };
  }, []);

  const handleEdit = (user) => {
    setEditingUser(user);
    setNewUser({ ...user, password: '' });
    setShowModal(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/auth/user/${userToDelete.id_usuario}`);
      setUsers(users.filter(user => user.id_usuario !== userToDelete.id_usuario));
      socket.emit('userUpdate');
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error al eliminar el usuario:', error);
    }
  };

  const confirmDelete = (user) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    setNewUser({ ...newUser, foto: file });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let response;
      const formData = new FormData();
      formData.append('id_usuario', newUser.id_usuario);
      formData.append('nombre', newUser.nombre);
      formData.append('tipo', newUser.tipo);
      formData.append('telefono', newUser.telefono);
      if (newUser.tipo === 'tipo2') { // Conductor
        formData.append('movil', newUser.movil);
        formData.append('navegacion', newUser.navegacion);
        formData.append('placa', newUser.placa);
      }
      if (newUser.password) {
        formData.append('password', newUser.password);
      }
      if (newUser.foto) {
        formData.append('foto', newUser.foto);
      }

      if (editingUser) {
        response = await axios.put(`${process.env.REACT_APP_API_URL}/api/auth/user/${editingUser.id_usuario}`, formData);
      } else {
        response = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/register`, formData);
      }

      setUsers(editingUser ? users.map(user => (user.id_usuario === editingUser.id_usuario ? response.data : user)) : [...users, response.data]);
      setEditingUser(null);
      setNewUser({ id_usuario: '', nombre: '', tipo: '', password: '', telefono: '', movil: '', navegacion: 'google_maps', placa: '', foto: null });
      setShowModal(false);
      socket.emit('userUpdate');
    } catch (error) {
      console.error('Error al guardar el usuario:', error);
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setUsers(users.slice().sort((a, b) => {
      let aKey = a[key];
      let bKey = b[key];
      if (key === 'tipo') {
        aKey = aKey === 'tipo1' ? 'Operador' : 'Conductor';
        bKey = bKey === 'tipo1' ? 'Operador' : 'Conductor';
      } else if (key === 'socket_id') {
        aKey = aKey ? 'Activo' : 'Inactivo';
        bKey = bKey ? 'Activo' : 'Inactivo';
      }

      if (aKey < bKey) return direction === 'asc' ? -1 : 1;
      if (aKey > bKey) return direction === 'asc' ? 1 : -1;
      return 0;
    }));
  };

  return (
    <div className="container-fluid contenido">
      <Navbar />
      <div className="container mt-5">
        <h1 className="mb-3">Lista de Conductores</h1>
        <button onClick={() => { setShowModal(true); setEditingUser(null); setNewUser({ id_usuario: '', nombre: '', tipo: '', password: '', telefono: '', movil: '', navegacion: 'google_maps', placa: '', foto: null }); }} className="btn btn-warning mb-3">Agregar Usuario</button>

        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>{editingUser ? 'Editar Usuario' : 'Agregar Usuario'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="id_usuario">
                <Form.Label>Cédula:</Form.Label>
                <Form.Control
                  type="text"
                  value={newUser.id_usuario}
                  onChange={(e) => setNewUser({ ...newUser, id_usuario: e.target.value })}
                  required
                  disabled={editingUser !== null}
                />
              </Form.Group>
              <Form.Group controlId="nombre">
                <Form.Label>Nombre:</Form.Label>
                <Form.Control
                  type="text"
                  value={newUser.nombre}
                  onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
                  required
                />
              </Form.Group>
              <Form.Group controlId="telefono">
                <Form.Label>Teléfono:</Form.Label>
                <Form.Control
                  type="text"
                  value={newUser.telefono}
                  onChange={(e) => setNewUser({ ...newUser, telefono: e.target.value })}
                  required
                />
              </Form.Group>
              {newUser.tipo === 'tipo2' && ( // Conductor
                <>
                  <Form.Group controlId="movil">
                    <Form.Label>Móvil:</Form.Label>
                    <Form.Control
                      type="text"
                      value={newUser.movil}
                      onChange={(e) => setNewUser({ ...newUser, movil: e.target.value })}
                      required
                    />
                  </Form.Group>
                  <Form.Group controlId="placa">
                    <Form.Label>Placa:</Form.Label>
                    <Form.Control
                      type="text"
                      value={newUser.placa}
                      onChange={(e) => setNewUser({ ...newUser, placa: e.target.value })}
                      required
                    />
                  </Form.Group>
                  <Form.Group controlId="navegacion">
                    <Form.Label>Sistema de Navegación:</Form.Label>
                    <Form.Control
                      as="select"
                      value={newUser.navegacion}
                      onChange={(e) => setNewUser({ ...newUser, navegacion: e.target.value })}
                      required
                    >
                      <option value="Google Maps">Google Maps</option>
                      <option value="Waze">Waze</option>
                    </Form.Control>
                  </Form.Group>
                </>
              )}
              <Form.Group controlId="tipo">
                <Form.Label>Tipo:</Form.Label>
                <Form.Control
                  as="select"
                  value={newUser.tipo}
                  onChange={(e) => setNewUser({ ...newUser, tipo: e.target.value })}
                >
                  <option value="">Seleccione un tipo</option>
                  <option value="tipo1">Operador</option>
                  <option value="tipo2">Conductor</option>
                </Form.Control>
              </Form.Group>
              <Form.Group controlId="password">
                <Form.Label>Contraseña:</Form.Label>
                <Form.Control
                  type="password"
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required={!editingUser}
                />
              </Form.Group>
              <Form.Group controlId="foto">
                <Form.Label>Foto:</Form.Label>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  style={{ border: '1px dashed #ccc', padding: '20px', textAlign: 'center' }}
                >
                  Arrastra y suelta la imagen aquí o
                  <Form.Control type="file" onChange={(e) => setNewUser({ ...newUser, foto: e.target.files[0] })} style={{ display: 'inline-block', marginLeft: '10px' }} />
                </div>
                {newUser.foto && <p>Archivo seleccionado: {newUser.foto.name}</p>}
              </Form.Group>
              <br></br>
              <Button variant="warning" type="submit" className="mr-2">Guardar</Button>
              <Button variant="secondary" onClick={() => { setShowModal(false); setEditingUser(null); setNewUser({ id_usuario: '', nombre: '', tipo: '', password: '', telefono: '', movil: '', navegacion: 'google_maps', placa: '', foto: null }); }}>Cancelar</Button>
            </Form>
          </Modal.Body>
        </Modal>

        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirmar eliminación</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            ¿Está seguro de que desea eliminar a este usuario?
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</Button>
            <Button variant="danger" onClick={handleDelete}>Eliminar</Button>
          </Modal.Footer>
        </Modal>

        <div className="table-responsive">
          <table className="table table-striped text-center">
            <thead>
              <tr>
                <th>Foto</th>
                <th>ID</th>
                <th>
                  Nombre 
                  <ArrowUp onClick={() => requestSort('nombre')} style={{ cursor: 'pointer', marginLeft: '5px' }} />
                  <ArrowDown onClick={() => requestSort('nombre')} style={{ cursor: 'pointer', marginLeft: '5px' }} />
                </th>
                <th>
                  Tipo 
                  <ArrowUp onClick={() => requestSort('tipo')} style={{ cursor: 'pointer', marginLeft: '5px' }} />
                  <ArrowDown onClick={() => requestSort('tipo')} style={{ cursor: 'pointer', marginLeft: '5px' }} />
                </th>
                <th>
                  Móvil 
                  <ArrowUp onClick={() => requestSort('movil')} style={{ cursor: 'pointer', marginLeft: '5px' }} />
                  <ArrowDown onClick={() => requestSort('movil')} style={{ cursor: 'pointer', marginLeft: '5px' }} />
                </th>
                <th>
                  Estado 
                  <ArrowUp onClick={() => requestSort('socket_id')} style={{ cursor: 'pointer', marginLeft: '5px' }} />
                  <ArrowDown onClick={() => requestSort('socket_id')} style={{ cursor: 'pointer', marginLeft: '5px' }} />
                </th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id_usuario}>
                  <td><img src={`${process.env.REACT_APP_API_URL}/${user.foto}`} alt={user.nombre} style={{ width: '50px', height: '50px', borderRadius: '50%' }} /></td>
                  <td>{user.id_usuario}</td>
                  <td>{user.nombre}</td>
                  <td>{user.tipo === 'tipo1' ? 'Operador' : 'Conductor'}</td>
                  <td>{user.movil}</td>
                  <td>
                    <span style={{ color: user.socket_id ? 'green' : 'red' }}>
                      ●
                    </span>
                  </td>
                  <td>
                    <PencilSquare onClick={() => handleEdit(user)} style={{ cursor: 'pointer', marginRight: '10px' }} />
                    <Trash onClick={() => confirmDelete(user)} style={{ cursor: 'pointer', marginRight: '10px', color: 'red' }} />
                    <Telephone style={{ cursor: 'pointer', marginRight: '10px' }} />
                    <AudioRecorderButtonSingle userId={user.id_usuario} />
                    <Link to={`/history-trips/${user.id_usuario}`}>
                      <JournalText style={{ cursor: 'pointer' }} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default UserList;
