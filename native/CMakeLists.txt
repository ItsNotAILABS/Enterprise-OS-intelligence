cmake_minimum_required(VERSION 3.18)
project(OrganismNative LANGUAGES CXX)

set(CMAKE_CXX_STANDARD          20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS        OFF)

# ── Compiler flags ────────────────────────────────────────────────────────────
if(MSVC)
    add_compile_options(/W4 /WX /O2)
else()
    add_compile_options(-Wall -Wextra -Wpedantic -O2)
endif()

# ── Include directories ───────────────────────────────────────────────────────
include_directories(
    ${CMAKE_CURRENT_SOURCE_DIR}/phi-math
    ${CMAKE_CURRENT_SOURCE_DIR}/organism-kernel
)

# ── Kernel executor demo executable ──────────────────────────────────────────
add_executable(organism_kernel_demo
    organism-kernel/organism_kernel_demo.cpp
)
target_include_directories(organism_kernel_demo PRIVATE
    phi-math
    organism-kernel
)

# ── Enable threading (required for std::mutex) ────────────────────────────────
find_package(Threads REQUIRED)
target_link_libraries(organism_kernel_demo PRIVATE Threads::Threads)

# ── CTest smoke-test ──────────────────────────────────────────────────────────
enable_testing()
add_test(NAME organism_kernel_smoke COMMAND organism_kernel_demo)
