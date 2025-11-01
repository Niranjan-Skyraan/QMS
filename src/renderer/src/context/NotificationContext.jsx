import React, { useState, useContext, createContext } from "react";

const NotificationContext = createContext()

export const NotificationProvider = ({children})=>{
  const [notificationCount, setNotificationCount] = useState(0);

  const updateNotificationCount = (count)=>{
    setNotificationCount(count);
  };

  return(
    <NotificationContext.Provider value= {{notificationCount, updateNotificationCount}}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotification = ()=>{
  return useContext(NotificationContext)
}