const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const app = express();
app.use(cors());
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: function (origin, callback) {
            callback(null, true);
        },
        methods: ["GET", "POST"],
        credentials: true
    }
});
// Almacén de sesiones con usuarios y sus nombres
const sessions = new Map(); // sessionId -> { files: Map, users: Map }
io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);
    let currentSession = null;
    let userName = null;
    socket.on('join-session', ({ sessionId, name }) => {
        currentSession = sessionId;
        userName = name || 'Anónimo';
        socket.join(sessionId);
        // Inicializar sesión si no existe
        if (!sessions.has(sessionId)) {
            sessions.set(sessionId, {
                files: new Map([
                    ['welcome.js', {
                        name: 'welcome.js',
                        content: '// Bienvenido al editor colaborativo\n// Crea nuevos archivos o abre archivos existentes\n\nconsole.log("¡Hola mundo!");',
                        language: 'javascript'
                    }]
                ]),
                users: new Map()
            });
        }
        const session = sessions.get(sessionId);
        // Agregar usuario con su nombre
        session.users.set(socket.id, {
            id: socket.id,
            name: userName,
            color: generateUserColor(socket.id)
        });
        // Enviar lista de archivos al usuario
        const filesList = Array.from(session.files.values());
        socket.emit('load-files', filesList);
        // Enviar lista de usuarios conectados a todos
        const usersList = Array.from(session.users.values());
        io.to(sessionId).emit('users-update', usersList);
        // Notificar que un usuario se unió
        socket.to(sessionId).emit('user-joined', { name: userName });
        console.log(`${userName} (${socket.id}) se unió a la sesión ${sessionId}`);
    });
    socket.on('create-file', ({ sessionId, fileName, language }) => {
        const session = sessions.get(sessionId);
        if (session) {
            const newFile = {
                name: fileName,
                content: `// ${fileName}\n`,
                language: language || 'javascript'
            };
            session.files.set(fileName, newFile);
            io.to(sessionId).emit('file-created', newFile);
        }
    });
    socket.on('update-file', ({ sessionId, fileName, content }) => {
        const session = sessions.get(sessionId);
        if (session && session.files.has(fileName)) {
            const file = session.files.get(fileName);
            file.content = content;
            socket.to(sessionId).emit('file-updated', { fileName, content });
        }
    });
    socket.on('delete-file', ({ sessionId, fileName }) => {
        const session = sessions.get(sessionId);
        if (session) {
            session.files.delete(fileName);
            io.to(sessionId).emit('file-deleted', fileName);
        }
    });
    socket.on('disconnect', () => {
        console.log('Usuario desconectado:', socket.id);
        if (currentSession) {
            const session = sessions.get(currentSession);
            if (session && session.users.has(socket.id)) {
                const user = session.users.get(socket.id);
                session.users.delete(socket.id);
                const usersList = Array.from(session.users.values());
                io.to(currentSession).emit('users-update', usersList);
                // Notificar que un usuario se fue
                socket.to(currentSession).emit('user-left', { name: user.name });
            }
        }
    });
});
// Generar color único basado en el ID del socket
function generateUserColor(socketId) {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
        '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
        '#F8B739', '#52B788', '#E63946', '#457B9D'
    ];
    let hash = 0;
    for (let i = 0; i < socketId.length; i++) {
        hash = socketId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});