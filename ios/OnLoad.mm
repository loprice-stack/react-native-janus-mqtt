#import <Foundation/Foundation.h>
#import "JanusMqttImpl.h"
#import <ReactCommon/CxxTurboModuleUtils.h>

@interface JanusMqttOnLoad : NSObject
@end

@implementation JanusMqttOnLoad

using namespace facebook::react;

+ (void)load
{
  registerCxxModuleToGlobalModuleMap(
    std::string(JanusMqttImpl::kModuleName),
    [](std::shared_ptr<CallInvoker> jsInvoker) {
      return std::make_shared<JanusMqttImpl>(jsInvoker);
    }
  );
}

@end
