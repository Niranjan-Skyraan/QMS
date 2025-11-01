export const ServerURL = (id) => {
  return `http://localhost:5000/user/active-users/${id}`
}

export const EndConnectionURL = (id) => {
  return `http://localhost:5000/end-connection/${id}`
}

export const ProfileURL = (profile_pic) => {
  return `http://localhost:5000/usersimage/${profile_pic}`
}

export default ServerURL