export interface LoginParams {
  user: string
  passwd: string
}

export const setLogin = () => {
  localStorage.setItem('login', 'true')
}

export const getLogin = () => {
  return localStorage.getItem('login') === 'true'
}

export const removeLogin = () => {
  localStorage.removeItem('login')
}
