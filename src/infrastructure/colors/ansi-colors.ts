/**
 * ANSI color codes for terminal output
 * No external dependencies - pure ANSI escape sequences
 */

export interface ColorTheme {
  // Error colors
  primaryError: (text: string) => string;
  rootError: (text: string) => string;
  intermediateError: (text: string) => string;
  
  // Section colors
  section: (text: string) => string;
  
  // Function and path colors
  appFunction: (text: string) => string;
  filePath: (text: string) => string;
  internalFrame: (text: string) => string;
  
  // Reset
  reset: string;
}

// ANSI color codes
const ANSI = {
  RED_BRIGHT: '\x1b[31m',
  YELLOW: '\x1b[33m', 
  CYAN: '\x1b[36m',
  GREEN: '\x1b[32m',
  GRAY: '\x1b[90m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m'
} as const;

/**
 * Terminal color theme for trace-pretty
 */
export const terminalTheme: ColorTheme = {
  // Rouge vif (31) → erreur principale et erreur racine
  primaryError: (text: string) => `${ANSI.RED_BRIGHT}${ANSI.BOLD}${text}${ANSI.RESET}`,
  rootError: (text: string) => `${ANSI.RED_BRIGHT}${text}${ANSI.RESET}`,
  
  // Jaune (33) → erreurs intermédiaires (causes en cascade)
  intermediateError: (text: string) => `${ANSI.YELLOW}${text}${ANSI.RESET}`,
  
  // Cyan (36) → sections ("Location", "Call chain")
  section: (text: string) => `${ANSI.CYAN}${ANSI.BOLD}${text}${ANSI.RESET}`,
  
  // Vert (32) → noms de fonctions applicatives
  appFunction: (text: string) => `${ANSI.GREEN}${text}${ANSI.RESET}`,
  
  // Gris (90) → chemins de fichiers + frames internes
  filePath: (text: string) => `${ANSI.GRAY}${text}${ANSI.RESET}`,
  internalFrame: (text: string) => `${ANSI.GRAY}${text}${ANSI.RESET}`,
  
  reset: ANSI.RESET
};

/**
 * No-color theme for environments that don't support colors
 */
export const noColorTheme: ColorTheme = {
  primaryError: (text: string) => text,
  rootError: (text: string) => text,
  intermediateError: (text: string) => text,
  section: (text: string) => text,
  appFunction: (text: string) => text,
  filePath: (text: string) => text,
  internalFrame: (text: string) => text,
  reset: ''
};

/**
 * Detect if terminal supports colors
 */
export function supportsColor(): boolean {
  // Check common environment variables
  if (process.env.FORCE_COLOR === '1' || process.env.FORCE_COLOR === 'true') {
    return true;
  }
  
  if (process.env.NO_COLOR || process.env.FORCE_COLOR === '0' || process.env.FORCE_COLOR === 'false') {
    return false;
  }
  
  // Check if we're in a TTY
  if (process.stdout && !process.stdout.isTTY) {
    return false;
  }
  
  // Check terminal type
  const term = process.env.TERM;
  if (term === 'dumb') {
    return false;
  }
  
  return !!(term && term !== 'dumb');
}

/**
 * Get appropriate theme based on environment
 */
export function getTheme(): ColorTheme {
  return supportsColor() ? terminalTheme : noColorTheme;
}