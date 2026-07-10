

export enum IconNames {
    SUN = 'SUN',
    MOON = 'MOON',
    LANGUAGE = 'LANGUAGE',
    PHONE = 'PHONE',
    USERS = 'USERS',
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT',
    CART = 'CART',
    MONEY = 'MONEY',
    CREDIT_CARD = 'CREDIT_CARD',
    TRANSFER = 'TRANSFER',
    ONLINE_PAYMENT = 'ONLINE_PAYMENT',
    ARROW_UP = 'ARROW_UP',
    ARROW_DOWN = 'ARROW_DOWN',
    ARROW_LEFT = 'ARROW_LEFT',
    ARROW_RIGHT = 'ARROW_RIGHT',
    IMAGE = 'IMAGE',
    USER_MINUS = 'USER_MINUS',
    DASHBOARD = 'DASHBOARD',
    REPORT = 'REPORT',
    BOX = 'BOX',
    CLOSE = 'CLOSE',
    LOCK = 'LOCK',
    SUCCESS = 'SUCCESS',
    PLUS = 'PLUS',
    MINUS = 'MINUS',
    TRASH = 'TRASH',
    PENCIL = 'PENCIL',
}
export interface IconProps {
    size?: number
    color?: string
    name: IconNames
}