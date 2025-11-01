import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)

    contextBridge.exposeInMainWorld('screenEvents', {
      onUnlock: (cd) => {
        const listener = (_event, payload) => {
          cb(payload.empId, payload.ip, payload.version)
        }
        ipcRenderer.on('screen-unlock', listener)
        return () => ipcRenderer.removeListener('screen-unlock', listener)
      },

      onLock: (cb) => {
        const listener = (_event, payload) => {
          cb(payload)
        }
        ipcRenderer.on('screen-lock', listener)
        return () => ipcRenderer.removeListener('screen-lock', listener)
      }
    })

    contextBridge.exposeInMainWorld('electronAPI', {
      getAppVersion: () => ipcRenderer.invoke('get-app-version')
    })

    contextBridge.exposeInMainWorld('get_emp_id', {
      showMainEmp_id: (emp_id) => {
        ipcRenderer.send('emp_id', emp_id)
      }
    })
  } catch (error) {
    console.error(error)
  }
} else {
  window.electron = electronAPI
  window.screeenEvents = {
    onUnlock: (cb) => {
      const listener = () => cb()
      ipcRenderer.on('screen-unlock', listener)
      return () => ipcRenderer.removeListener('screen-unlock', listener)
    },
    onLock: (cb) => {
      const listener = () => cb()
      ipcRenderer.on('screen-lock', listener)
      return () => ipcRenderer.removeListener('screen-lock', listener)
    }
  }
  window.electronAPI = {
    getAppVersion: () => ipcRenderer.invoke('get-app-version')
  }
}
