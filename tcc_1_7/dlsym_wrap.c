#define dlsym dlsym_wrap

void *dlsym_wrap(void *handle, char *symbol);

#include "tcc.c"

typedef struct TCCSyms {
    char *str;
    void *ptr;
} TCCSyms;

int blah_wrap(){
  printf("blah unimplemented\n");
  exit(1);
}

int dlerror_wrap(){
  printf("dlerror unimplemented\n");
  exit(1);
}

int dlopen_wrap(){
  printf("dlopen unimplemented\n");
  exit(1);
}

int getcwd_wrap(){
  printf("getcwd unimplemented\n");
  exit(1);
}

int ldexp_wrap(){
  printf("ldexp unimplemented\n");
  exit(1);
}

int lseek_wrap(){
  printf("lseek unimplemented\n");
  exit(1);
}

int memmove_wrap(){
  printf("memmove unimplemented\n");
  exit(1);
}

int sigaction_wrap(){
  printf("sigaction unimplemented\n");
  exit(1);
}

int sigemptyset_wrap(){
  printf("sigemptyset unimplemented\n");
  exit(1);
}

// dummy declarations to create required symbols
int close();
int fputc();
int open();
int read();

// TCCSyms must be defined here, I think there is a bug around global data
// relocations
// M2-Planet: We don't support initializing local arrays
TCCSyms tcc_syms[] = {
	{ "atoi", &atoi, },
	{ "close", &close, },
	{ "dlerror", &dlerror_wrap, },
	{ "dlopen", &dlopen_wrap, },
	// don't override here
	//      { "dlsym", &dlsym_wrap, },
	{ "exit", &exit, },
	{ "fclose", &fclose, },
	{ "fdopen", &fdopen, },
	{ "fopen", &fopen, },
	{ "fprintf", &fprintf, },
	{ "fputc", &fputc, },
	{ "free", &free, },
	{ "fwrite", &fwrite, },
	{ "fread", &fread, },
	{ "getc_unlocked", &getc_unlocked, },
	{ "getcwd", &getcwd_wrap, },
	{ "ldexp", &ldexp_wrap, },
	{ "lseek", &lseek_wrap, },
	{ "malloc", &malloc, },
	{ "memcmp", &memcmp, },
	{ "memcpy", &memcpy, },
	{ "memmove", &memmove_wrap, },
	{ "memset", &memset, },
	{ "mmap", &mmap, },
	{ "open", &open, },
	{ "printf", &printf, },
	{ "puts", &puts, },
	{ "read", &read, },
	{ "realloc", &realloc, },
	{ "sigaction", &sigaction_wrap, },
	{ "sigemptyset", &sigemptyset_wrap, },
	{ "snprintf", &snprintf, },
	{ "sprintf", &sprintf, },
	{ "stderr", &stderr, },
	{ "stdout", &stdout, },
	{ "strcat", &strcat, },
	{ "strchr", &strchr, },
	{ "strcmp", &strcmp, },
	{ "strcpy", &strcpy, },
	{ "strdup", &strdup, },
	{ "strlen", &strlen, },
	{ "strrchr", &strrchr, },
	{ "vfprintf", &vfprintf, },
	{ "blah", &blah_wrap, },
	{ NULL, NULL },
};
void *dlsym_wrap(void *handle, char *symbol)
{
  TCCSyms *s;
  s=tcc_syms;
  int p;

  printf("dlsym: %s\n",symbol);
  if(!strcmp("dlsym", symbol)) {
    return &dlsym_wrap;
  }

  while(s->str != NULL) {
    if (!strcmp(s->str, symbol))
      return s->ptr;
    s++;
  }


  printf("Unknown function: %s\n",symbol);
  exit(1);
}
