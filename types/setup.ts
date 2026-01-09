/**
 * Типы для компонентов шагов настройки VPN
 */

import { Variants } from 'framer-motion';

/**
 * Тип направления перехода между шагами
 * -1: переход назад
 * 1: переход вперед
 */
export type StepDirection = -1 | 1;

/**
 * Варианты анимации для шагов
 */
export type StepVariants = Variants;

/**
 * Тип платформы пользователя
 */
export type PlatformType = 'iOS' | 'Android' | 'macOS' | 'Desktop' | 'Web' | string;

/**
 * Базовые props для всех шагов
 */
export interface BaseStepProps {
  direction: StepDirection;
  variants: StepVariants;
}

/**
 * Props для Step1Welcome
 */
export interface Step1WelcomeProps extends BaseStepProps {
  platform: PlatformType;
  onNext: () => void;
  onOtherDevice: () => void;
}

/**
 * Props для Step2Install
 */
export interface Step2InstallProps extends BaseStepProps {
  onBack: () => void;
  onNext: () => void;
  onInstall: () => void;
  onCheckInstalled?: () => void;
  isChecking?: boolean;
}

/**
 * Props для Step3Subscription
 */
export interface Step3SubscriptionProps extends BaseStepProps {
  step?: number;
  subscriptionUrl?: string;
  isAdding?: boolean;
  isChecking?: boolean;
  onBack: () => void;
  onNext: () => void;
  onAdd: () => void;
}

/**
 * Props для Step4Complete
 */
export interface Step4CompleteProps extends BaseStepProps {
  onBack: () => void;
  onRestart?: () => void;
  onCheckVpn?: () => void;
  isChecking?: boolean;
}
