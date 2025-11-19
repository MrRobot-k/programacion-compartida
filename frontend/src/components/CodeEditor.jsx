import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
function CodeEditor() {
  const [sessionId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('session') || uuidv4();
  });
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [users, setUsers] = useState([]);
  const [showCopied, setShowCopied] = useState(false);
  const [showNewFileModal, setShowNewFileModal] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  // Modal de nombre
  const [showNameModal, setShowNameModal] = useState(true);
  const [userName, setUserName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  // Notificaciones
  const [notification, setNotification] = useState(null);
  const [editorLoading, setEditorLoading] = useState(true);
  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const editorRef = useRef(null);
  const isRemoteChange = useRef(false);
  const updateTimeout = useRef(null);
  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'json', label: 'JSON' },
    { value: 'markdown', label: 'Markdown' },
    { value: 'plaintext', label: 'Texto plano (.txt)' }
  ];
  // Cargar nombre guardado
  useEffect(() => {
    const savedName = localStorage.getItem('editorUserName');
    if (savedName) setUserName(savedName);
  }, []);
  const handleJoinSession = () => {
    if (!userName.trim()) {
      alert('Por favor ingresa tu nombre');
      return;
    }
    localStorage.setItem('editorUserName', userName.trim());
    setShowNameModal(false);
    setHasJoined(true);
    // Conectar despuÃ©s de obtener el nombre
    initializeSocket();
  };
  const initializeSocket = () => {
    window.history.replaceState(null, '', `?session=${sessionId}`);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://programacion-compartida.onrender.com';
    console.log('ðŸ”— Intentando conectar a:', backendUrl);
    socketRef.current = io(backendUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000
    });
    socketRef.current.on('connect', () => {
      setIsConnected(true);
      console.log('âœ… Conectado al servidor');
      socketRef.current.emit('join-session', { sessionId, name: userName });
    });
    socketRef.current.on('load-files', (filesList) => {
      setFiles(filesList);
      if (filesList.length > 0 && !activeFile) setActiveFile(filesList[0]);
    });
    socketRef.current.on('file-created', (newFile) => {
      setFiles(prev => [...prev, newFile]);
      setActiveFile(newFile);
    });
    socketRef.current.on('file-updated', ({ fileName, content }) => {
      console.log('📥 Recibiendo actualización remota:', fileName);
      isRemoteChange.current = true;
      setFiles(prev => prev.map(f =>
        f.name === fileName ? { ...f, content } : f
      ));

      // Si es el archivo activo, actualizar el editor directamente
      if (activeFile?.name === fileName) {
        setActiveFile(prev => ({ ...prev, content }));
        // Actualizar Monaco Editor directamente para evitar conflictos
        if (editorRef.current) {
          const currentPosition = editorRef.current.getPosition();
          editorRef.current.setValue(content);
          // Restaurar posición del cursor si es posible
          if (currentPosition) editorRef.current.setPosition(currentPosition);
        }
      }
      // Resetear flag después de un breve delay
      setTimeout(() => {
        isRemoteChange.current = false;
      }, 100);
    });
    socketRef.current.on('file-deleted', (fileName) => {
      setFiles(prev => {
        const filtered = prev.filter(f => f.name !== fileName);
        if (activeFile?.name === fileName) setActiveFile(filtered[0] || null);
        return filtered;
      });
    });
    socketRef.current.on('file-renamed', ({ oldName, newName }) => {
      setFiles(prev => prev.map(f =>
        f.name === oldName ? { ...f, name: newName } : f
      ));
      if (activeFile?.name === oldName) setActiveFile(prev => ({ ...prev, name: newName }));
    });
    socketRef.current.on('users-update', (usersList) => {
      setUsers(usersList);
    });
    socketRef.current.on('user-joined', ({ name }) => {
      showNotification(`${name} se uniÃ³ a la sesiÃ³n`, '#28a745');
    });
    socketRef.current.on('user-left', ({ name }) => {
      showNotification(`${name} saliÃ³ de la sesiÃ³n`, '#ffc107');
    });
    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
      console.log('Desconectado del servidor');
    });
    socketRef.current.on('connect_error', (error) => {
      console.error('Error de conexiÃ³n:', error);
      setIsConnected(false);
    });
  };
  useEffect(() => {
    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);
  const showNotification = (message, color) => {
    setNotification({ message, color });
    setTimeout(() => setNotification(null), 3000);
  };
  const handleEditorChange = (value) => {
    if (!activeFile) return;
    // Si es un cambio remoto, no hacer nada (ya se aplicó)
    if (isRemoteChange.current) {
      console.log('⏭️ Ignorando cambio remoto en onChange');
      return;
    }
    console.log('✏️ Cambio local detectado');
    // Actualizar estado local inmediatamente
    setActiveFile(prev => ({ ...prev, content: value }));
    setFiles(prev => prev.map(f =>
      f.name === activeFile.name ? { ...f, content: value } : f
    ));
    // Debounce: enviar al servidor después de un breve delay
    if (updateTimeout.current) clearTimeout(updateTimeout.current);
    updateTimeout.current = setTimeout(() => {
      console.log('📤 Enviando actualización al servidor');
      socketRef.current.emit('update-file', {
        sessionId,
        fileName: activeFile.name,
        content: value
      });
    }, 300); // 300ms de debounce
  };
  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    const fileName = newFileName.includes('.') ? newFileName : `${newFileName}.${getExtension(selectedLanguage)}`;
    socketRef.current.emit('create-file', {
      sessionId,
      fileName,
      language: selectedLanguage
    });
    setNewFileName('');
    setShowNewFileModal(false);
  };
  const handleOpenFile = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const language = detectLanguage(file.name);
      socketRef.current.emit('create-file', {
        sessionId,
        fileName: file.name,
        language
      });
      setTimeout(() => {
        socketRef.current.emit('update-file', {
          sessionId,
          fileName: file.name,
          content
        });
      }, 100);
    };
    reader.readAsText(file);
  };
  const handleDownloadFile = () => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleDeleteFile = (fileName) => {
    if (files.length <= 1) {
      alert('No puedes eliminar el Ãºltimo archivo');
      return;
    }
    if (confirm(`Â¿Eliminar ${fileName}?`)) socketRef.current.emit('delete-file', { sessionId, fileName });
  };
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2500);
  };
  const getExtension = (language) => {
    const extensions = {
      javascript: 'js',
      typescript: 'ts',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      html: 'html',
      css: 'css',
      json: 'json',
      markdown: 'md',
      txt: 'plaintext'
    };
    return extensions[language] || 'txt';
  };
  const detectLanguage = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    const langMap = {
      js: 'javascript',
      ts: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      html: 'html',
      css: 'css',
      json: 'json',
      md: 'markdown',
      txt: 'plaintext'
    };
    return langMap[ext] || 'javascript';
  };
  if (!hasJoined) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
      }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          style={{
            background: '#252526',
            padding: '40px',
            borderRadius: '12px',
            minWidth: '400px',
            color: 'white',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
          }}>
          <h2 style={{
            margin: '0 0 10px 0',
            fontSize: '28px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            âš¡ Editor Colaborativo
          </h2>
          <p style={{
            margin: '0 0 25px 0',
            color: '#999',
            fontSize: '14px'
          }}>
            Ingresa tu nombre para empezar a colaborar
          </p>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Tu nombre"
            onKeyPress={(e) => e.key === 'Enter' && handleJoinSession()}
            autoFocus
            style={{
              width: '100%',
              padding: '12px',
              background: '#3c3c3c',
              border: '2px solid #555',
              borderRadius: '6px',
              color: 'white',
              fontSize: '15px',
              marginBottom: '20px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#555'}
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleJoinSession}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}>
            Unirse a la sesiÃ³n
          </motion.button>
        </motion.div>
      </div>
    );
  }
  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      background: '#1e1e1e',
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          padding: '10px 20px',
          background: '#252526',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #3e3e42',
          flexShrink: 0
        }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h2 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            color: '#cccccc'
          }}>
            âš¡ Editor Colaborativo
          </h2>
          {/* Menu de archivo */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: '#094771' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewFileModal(true)}
              style={{
                padding: '6px 12px',
                background: '#0e639c',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer'
              }}>
              ðŸ“„ Nuevo
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: '#094771' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '6px 12px',
                background: '#0e639c',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer'
              }}>
              ðŸ“‚ Abrir
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, backgroundColor: '#094771' }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDownloadFile}
              disabled={!activeFile}
              style={{
                padding: '6px 12px',
                background: activeFile ? '#0e639c' : '#555',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                fontSize: '12px',
                fontWeight: '500',
                cursor: activeFile ? 'pointer' : 'not-allowed'
              }}>
              ðŸ’¾ Guardar
            </motion.button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleOpenFile}
              style={{ display: 'none' }}
              accept=".js,.ts,.py,.java,.cpp,.html,.css,.json,.md,.txt"
            />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* Lista de usuarios */}
          <div style={{
            padding: '5px 12px',
            background: '#3e3e42',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#cccccc',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ðŸ‘¥ {users.length} en lÃ­nea
            {users.length > 0 && (
              <div style={{
                display: 'flex',
                gap: '4px',
                marginLeft: '4px'
              }}>
                {users.slice(0, 5).map((user) => (
                  <div
                    key={user.id}
                    title={user.name}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: user.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      color: 'white',
                      border: '2px solid #252526'
                    }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {users.length > 5 && (
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: '#666',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    color: 'white'
                  }}>
                    +{users.length - 5}
                  </div>
                )}
              </div>
            )}
          </div>
          <motion.span
            animate={{
              opacity: isConnected ? [1, 0.6, 1] : 1
            }}
            transition={{
              repeat: isConnected ? Infinity : 0,
              duration: 2
            }}
            style={{
              padding: '5px 12px',
              background: isConnected ? '#28a745' : '#dc3545',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'white'
            }} />
            {isConnected ? 'Conectado' : 'Desconectado'}
          </motion.span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopyLink}
            style={{
              padding: '6px 14px',
              background: '#0e639c',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer'
            }}>
            ðŸ“‹ Compartir
          </motion.button>
        </div>
      </motion.div>
      {/* Tabs de archivos */}
      <div style={{
        display: 'flex',
        background: '#2d2d30',
        borderBottom: '1px solid #3e3e42',
        overflowX: 'auto',
        flexShrink: 0
      }}>
        {files.map(file => (
          <motion.div
            key={file.name}
            whileHover={{ backgroundColor: '#3e3e42' }}
            onClick={() => setActiveFile(file)}
            style={{
              padding: '8px 16px',
              background: activeFile?.name === file.name ? '#1e1e1e' : 'transparent',
              borderRight: '1px solid #3e3e42',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: '120px',
              color: activeFile?.name === file.name ? '#fff' : '#999',
              fontSize: '13px'
            }}>
            <span>{file.name}</span>
            {files.length > 1 && (
              <motion.button
                whileHover={{ scale: 1.2, color: '#ff4444' }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFile(file.name);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#999',
                  cursor: 'pointer',
                  padding: '0',
                  fontSize: '14px'
                }}>
                Ã—
              </motion.button>
            )}
          </motion.div>
        ))}
      </div>
      {/* Editor */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {editorLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: '#1e1e1e',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              gap: '20px'
            }}>
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.1, 1]
              }}
              transition={{
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
              }}
              style={{
                width: '60px',
                height: '60px',
                border: '4px solid #3e3e42',
                borderTop: '4px solid #667eea',
                borderRadius: '50%'
              }}
            />
            <motion.p
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{
                color: '#999',
                fontSize: '14px',
                fontWeight: '500'
              }}>
              ⚡ Cargando editor...
            </motion.p>
          </motion.div>
        )}
        {activeFile && (
          <Editor
            height="100%"
            language={activeFile.language}
            theme="vs-dark"
            value={activeFile.content}
            onChange={handleEditorChange}
            onMount={(editor) => {
              editorRef.current = editor;
              setEditorLoading(false);
            }}
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
              fontLigatures: true,
              wordWrap: 'on',
              lineHeight: 22,
              padding: { top: 15, bottom: 15 },
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              automaticLayout: true
            }}
          />
        )}
      </div>
      {/* Modal Nuevo Archivo */}
      <AnimatePresence>
        {showNewFileModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNewFileModal(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#252526',
                padding: '30px',
                borderRadius: '8px',
                minWidth: '400px',
                color: 'white'
              }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px' }}>Crear nuevo archivo</h3>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="nombre-del-archivo"
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFile()}
                autoFocus
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#3c3c3c',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '14px',
                  marginBottom: '15px'
                }}
              />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#3c3c3c',
                  border: '1px solid #555',
                  borderRadius: '4px',
                  color: 'white',
                  fontSize: '14px',
                  marginBottom: '20px'
                }}>
                {languages.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowNewFileModal(false)}
                  style={{
                    padding: '8px 16px',
                    background: '#555',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}>
                  Cancelar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateFile}
                  style={{
                    padding: '8px 16px',
                    background: '#0e639c',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}>
                  Crear
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* NotificaciÃ³n de enlace copiado */}
      {showCopied && (
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
          style={{
            position: 'fixed',
            top: '80px',
            right: '20px',
            padding: '12px 20px',
            background: '#28a745',
            color: 'white',
            borderRadius: '6px',
            fontWeight: '500',
            fontSize: '13px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 1000
          }}>
          âœ“ Enlace copiado
        </motion.div>
      )}
      {/* Notificaciones de usuarios */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            style={{
              position: 'fixed',
              bottom: '20px',
              left: '20px',
              padding: '12px 20px',
              background: notification.color,
              color: 'white',
              borderRadius: '6px',
              fontWeight: '500',
              fontSize: '13px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
export default CodeEditor;