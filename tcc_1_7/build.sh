# After we can add non-M2libc dirs to include paths
${CC} -I . loader.c

# tcc.c is included by dlsym_wrap.c
# i386-gen.c is included by tcc.c
${CC} -I . dlsym_wrap.c

