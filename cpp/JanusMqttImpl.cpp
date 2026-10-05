#include "JanusMqttImpl.h"

namespace facebook::react {

JanusMqttImpl::JanusMqttImpl(
  std::shared_ptr<CallInvoker> jsInvoker
)
  : NativeJanusMqttCxxSpec(std::move(jsInvoker)) {}

double JanusMqttImpl::multiply(
  jsi::Runtime& rt,
  double a,
  double b
) {
  return a * b;
}

}
