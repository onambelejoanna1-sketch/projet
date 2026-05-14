// Bornes des champs de formulaire — doivent rester synchrones avec les validateurs
// backend (backend/src/validators/{auth,disasters}.validators.js).

export const DISASTER_TITLE_MIN = 4;
export const DISASTER_TITLE_MAX = 80;
export const DISASTER_DESCRIPTION_MIN = 10;
export const DISASTER_DESCRIPTION_MAX = 500;
export const DISASTER_REJECT_REASON_MIN = 3;
export const DISASTER_REJECT_REASON_MAX = 200;

export const USER_DISPLAY_NAME_MIN = 2;
export const USER_DISPLAY_NAME_MAX = 60;
export const USER_PASSWORD_MIN = 8;

export const FEEDBACK_MAX = 500;
