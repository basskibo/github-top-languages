export interface Theme {
  title: string;
  text: string;
  icon: string;
  bg: string;
  border: string;
}

export interface Themes {
  [key: string]: Theme;
}

const themes: Themes = {
  default: {
    title: '#2f80ed',
    text: '#434d58',
    icon: '#586069',
    bg: '#fffefe',
    border: '#e4e2e2'
  },
  dark: {
    title: '#fff',
    text: '#9f9f9f',
    icon: '#858585',
    bg: '#151515',
    border: '#262626'
  },
  radical: {
    title: '#fe428e',
    text: '#a9fef7',
    icon: '#f8d847',
    bg: '#141321',
    border: '#fe428e'
  },
  merko: {
    title: '#abd200',
    text: '#68b587',
    icon: '#b7d364',
    bg: '#0a0f0b',
    border: '#abd200'
  },
  gruvbox: {
    title: '#fabd2f',
    text: '#8ec07c',
    icon: '#fe8019',
    bg: '#282828',
    border: '#fabd2f'
  },
  tokyonight: {
    title: '#70a5fd',
    text: '#38bdae',
    icon: '#bf91f3',
    bg: '#1a1b27',
    border: '#70a5fd'
  },
  onedark: {
    title: '#e4bf7a',
    text: '#df6d74',
    icon: '#8eb573',
    bg: '#282c34',
    border: '#e4bf7a'
  },
  cobalt: {
    title: '#e683d9',
    text: '#75eeb2',
    icon: '#0480ef',
    bg: '#193549',
    border: '#e683d9'
  },
  synthwave: {
    title: '#f21379',
    text: '#e5289e',
    icon: '#ef8539',
    bg: '#2b213a',
    border: '#f21379'
  }
};

export default themes;

