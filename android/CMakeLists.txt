cmake_minimum_required(VERSION 3.4.1)
project(JanusMqtt)

set (CMAKE_VERBOSE_MAKEFILE ON)

add_library(
    react-native-janus-mqtt    STATIC
    ../cpp/JanusMqttImpl.cpp
)

set_target_properties(
    react-native-janus-mqtt PROPERTIES
    CXX_STANDARD 20
    CXX_STANDARD_REQUIRED ON
    CXX_EXTENSIONS OFF
)

target_include_directories(
    react-native-janus-mqtt    PUBLIC
    ../cpp
)

target_link_libraries(
    react-native-janus-mqtt    jsi
    reactnative
    react_codegen_JanusMqttSpec
)
