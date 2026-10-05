#pragma once

#include <JanusMqttSpecJSI.h>

#include <memory>

namespace facebook::react {

class JanusMqttImpl
  : public NativeJanusMqttCxxSpec<JanusMqttImpl> {
public:
  JanusMqttImpl(std::shared_ptr<CallInvoker> jsInvoker);

  double multiply(jsi::Runtime& rt, double a, double b);
};

}
