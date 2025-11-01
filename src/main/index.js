import { app, shell, BrowserWindow, ipcMain, powerMonitor } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
// import axios from '../renderer/src/config/AxiosConfig'
import { get } from 'http';
import { notDeepEqual } from 'assert';
import { cwd } from 'process';



let emp_id = null; // Variable to Store emp_id (set by renderer via IPC)
let mainWindow = null; // Store the mainWindow reference
let isLocked = false; // Track screen lock state
let isQuitting = false; // Guard to avoid duplicate cleanup
let imgPath = join(process.cwd(),'resourses', 'icon.ico')
console.log(imgPath, 'ko');
function getLocalIPv4(){
  const interfaces = require('os').networkInterfaces()
  for (const name of Object.keys(interfaces)){
    for (const iface of interfaces[name]){
      if (iface.family ==='IPv4' && !iface.internal){
        return iface.address
      }
    } 
  }
  return 'unknown'
}


function endConnection(){
  if (!emp_id){
    console.log('endConnection: no emp_id, skipping');
    return Promise.resolve()
  }
  const ip = getLocalIPv4()
  const url = `http://localhost:5000/auth/logend-connection/${emp_id}?ip=${encodeURIComponent(ip)}`

  return axios.post(url)
              .then(()=>console.log('user marked as inactive (IP:', ip,')'))
              .catch((err)=>{
                console.log(err);
              })
}


function notifyActiveFromMain(){
  if(!emp_id){
    console.log('notifyActiveFromMain: no emp_id, skipping server ping');
    return Promise.resolve()
  }

  const ip = getLocalIPv4()
  const url = `http://localhost:5000/auth/logactive-users/${emp_id}?ip=${encodeURIComponent(ip)}`

  return axios.get(url)
              .then(()=>console.log('Server: user marked active (from main) (IP:', ip, ')'))
              .catch((err)=>{
                console.error('notifyActiveFromMain error:', err?.message || err)
              })
}

function notifyWake() {
  if (mainWindow) {
    const payload = {
      empId: emp_id,
      ip: emp_id ? getLocalIPv4() : undefined,
      version: app.getVersion() 
    }
    try {
      mainWindow.webContents.send('screen-unlock', payload)
      console.log('main -> renderer screen-unlock sent', payload)
    } catch (err) {
      console.error('Failed to send screen-unlock to renderer', err)
    }
  }
}


function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    icon: imgPath,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}


app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('get-app-version', () => app.getVersion())

  // powerMonitor.on('lock-screen',()=>{
  //   console.log('Power Monitor: Lock Screen Fired');
  //   isLocked = true;
    
  //   endConnection()

  //   if (mainWindow){
  //     const ip = getLocalIPv4();
  //     mainWindow.webContents.send('screen-lock',{empId: emp_id, ip})
  //   }
  // })

  // powerMonitor.on('suspend', ()=>{
  //   console.log('Power Monitor Suspend Fired');
  //   isLocked = true;
  //   endConnection();

  //   if (mainWindow){
  //     const ip = getLocalIPv4()
  //     mainWindow.webContents.send('screen-lock', {empId: emp_id, id})
  //   }
  // })

  powerMonitor.on('unlock-screen', async ()=>{
    console.log('powerMonitor: unlock-screen fired');

    try{
      await notifyActiveFromMain()
    }catch(err){
      console.log('notifyActiveFromMain threw',err);
    }
    notifyWake();
    isLocked= false
  })

  // powerMonitor.on('resume', async () => {
  //   console.log('powerMonitor: resume fired')
  //   try {
  //     await notifyActiveFromMain()
  //   } catch (err) {
  //     console.error('notifyActiveFromMain threw on resume:', err)
  //   }
  //   notifyWake()
  //   isLocked = false
  // })



  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
