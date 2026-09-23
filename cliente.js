import path from 'node:path';
import { fileURLToPath } from 'node:url';
import grpc from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const PROTO_PATH = path.join(currentDirectory, 'src', 'productos.proto');
const packageDef = protoLoader.loadSync(PROTO_PATH, { keepCase: true, longs: String, enums: String, defaults: true });
const proto = grpc.loadPackageDefinition(packageDef).productos;

const client = new proto.ProductoService('localhost:5000', grpc.credentials.createInsecure());

console.log('== ObtenerProducto (unary) ==');
client.obtenerProducto({ id: 1 }, (err, producto) => {
  if (err) {
    console.error('Error gRPC:', err.code, err.details);
    return;
  }
  console.log(`${producto.id} - ${producto.nombre} - $${producto.precio}`);

  console.log('\n== ListarProductos (server streaming) ==');
  const call = client.listarProductos({});
  call.on('data', (p) => {
    console.log(`${p.id} - ${p.nombre} - $${p.precio}  (llegó en streaming)`);
  });
  call.on('end', () => console.log('Streaming finalizado.'));
  call.on('error', (err) => console.error('Error en el stream:', err.code, err.details));

  console.log('\n== BuscarPorPrecioMaximo (precio <= 50) ==');
  const productosPorPrecio = client.buscarPorPrecioMaximo({ precioMaximo: 50 });
  productosPorPrecio.on('data', (p) => {
    console.log(`${p.id} - ${p.nombre} - $${p.precio}  (filtrado por precio)`);
  });
  productosPorPrecio.on('end', () => console.log('Streaming por precio finalizado.'));
  productosPorPrecio.on('error', (err) => console.error('Error en el stream por precio:', err.code, err.details));
});

console.log('\n== Prueba de error (id inexistente) ==');
client.obtenerProducto({ id: 999 }, (err, producto) => {
  if (err) {
    console.log(`Error gRPC: ${err.code} - ${err.details}`);
  } else {
    console.log('No debería llegar aquí:', producto);
  }
});