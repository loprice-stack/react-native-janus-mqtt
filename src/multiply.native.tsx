import JanusMqtt from './NativeJanusMqtt';

export function multiply(a: number, b: number): number {
  return JanusMqtt.multiply(a, b);
}
