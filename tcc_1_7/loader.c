#include <stddef.h>
#include <stdarg.h>
#include <stdlib.h>
#include <stdio.h>
#include <string.h>

#define FALSE 0
#define TRUE 1

#define PROT_READ      0x1
#define PROT_WRITE     0x2
#define PROT_EXEC      0x4
#define MAP_PRIVATE    0x02
#define MAP_ANONYMOUS  0x20

char* int2str(int x, int base, int signed_p)
{
	/* Be overly conservative and save space for 32binary digits and padding null */
	char* p = calloc(34, sizeof(char));
	/* if calloc fails return null to let calling code deal with it */
	if(NULL == p) return p;

	p = p + 32;
	unsigned i;
	int sign_p = FALSE;
	char* table = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

	if(signed_p && (10 == base) && (0 != (x & 0x80000000)))
	{
		/* Truncate to 31bits */
		i = -x & 0x7FFFFFFF;
		if(0 == i) return "-2147483648";
		sign_p = TRUE;
	} /* Truncate to 32bits */
	else i = x & (0x7FFFFFFF + 0x80000000); /* M2-Planet/cc_* can't handle large signed numbers in literals */

	do
	{
		p[0] = table[i % base];
		p = p - 1;
		i = i / base;
	} while(0 < i);

	if(sign_p)
	{
		p[0] = '-';
		p = p - 1;
	}

	return p + 1;
}

void puts_num(int x){
  char *s = int2str(x, 10, 0);
  puts(s);
}

void *mmap(void *addr, size_t len, int prot, int flags, int fildes, int off)
{
	puts("mmap wrapper: ");
	puts_num(addr);
	puts_num(len);
	puts_num(prot);
	puts_num(flags);
	puts_num(fildes);
	puts_num(off);
	return malloc(len);
}

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

#define dlsym dlsym_wrap

TCCSyms tcc_syms[] = {
	{ "atoi", &atoi, },
	{ "close", &close, },
	{ "dlerror", &dlerror_wrap, },
	{ "dlopen", &dlopen_wrap, },
	{ "exit", &exit, },
	{ "fclose", &fclose, },
	{ "fdopen", &fdopen, },
	{ "fopen", &fopen, },
	{ "fprintf", &fprintf, },
	{ "fputc", &fputc, },
	{ "free", &free, },
	{ "fwrite", &fwrite, },
	{ "fread", &fread, },
	{ "getc_unlocked", &getchar, },
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


int prog_rel;
int data_rel;

int global_relocs_table_base;
int global_relocs_table;
int relocs_base;
int global_relocs_base;
int glo,glo_base,prog,ind;
#define DATA_SIZE (256*1024)
#define TEXT_SIZE (256*1024)
#define RELOC_ADDR32 1  /* 32 bits relocation */
#define RELOC_REL32  2  /* 32 bits relative relocation */

int r32(int o){
  int r;
  r=((int *)(o))[0];
  return r;
}

int w32(int o,int v){
  int* optr = (int*)o;
  *optr=v;
}

int load_obj(void){
  printf("Loading object file\n");
  FILE *f;
  int text_len;
  int data_len;
  int reloc_len;
  int global_reloc_len;
  int global_reloc_table_len;
  int entrypoint;
  int m0=0xdeadbe00;
  int m1=0xdeadbe01;
  int m2=0xdeadbe02;
  int m3=0xdeadbe03;
  int m4=0xdeadbe04;
  int i;
  int t;
  f = fopen("tcc_boot.o", "rb");
  fread(&entrypoint,1,4,f);
  fread(&text_len,1,4,f);
  fread(&data_len,1,4,f);
  fread(&reloc_len,1,4,f);
  fread(&global_reloc_len,1,4,f);
  fread(&global_reloc_table_len,1,4,f);
  fread(&t,1,4,f);
  if(!(t==m0)){
    printf("sync m0 %x\n",t);
    exit(1);
  }
  global_relocs_table_base=(int)malloc(global_reloc_table_len);
  global_relocs_table=global_relocs_table_base;
  fread((void *)global_relocs_table_base,1,global_reloc_table_len,f);
  prog_rel=(int)malloc(text_len);
  data_rel=(int)malloc(data_len);

  fread(&t,1,4,f);
  if(!(t==m1)){
    printf("sync m1 %x\n",t);
    exit(1);
  }
  relocs_base=(int)malloc(reloc_len);
  fread((void *)relocs_base,1,reloc_len,f);
  fread(&t,1,4,f);
  if(!(t==m2)){
    printf("sync m2 %x\n",t);
    exit(1);
  }

  fread((void *)data_rel,1,data_len,f);

  fread(&t,1,4,f);
  if(!(t==m3)){
    printf("sync m3 %x\n",t);
    exit(1);
  }


  global_relocs_base=(int)malloc(global_reloc_len);
  fread((void *)global_relocs_base,1,global_reloc_len,f);

  fread(&t,1,4,f);
  if(!(t==m4)){
    printf("sync m4 %x\n",t);
    exit(1);
  }
  fread((void *)prog_rel,1,text_len,f);
  glo = (int)mmap(NULL, DATA_SIZE,
              PROT_READ | PROT_WRITE,
              MAP_PRIVATE | MAP_ANONYMOUS,
              -1, 0);
  glo_base=glo;
  printf("glo: %x %x\n",glo,glo_base);
  memset((void *)glo, 0, DATA_SIZE);
  prog = (int)mmap(NULL, TEXT_SIZE,
              PROT_EXEC | PROT_READ | PROT_WRITE,
              MAP_PRIVATE | MAP_ANONYMOUS,
              -1, 0);
  ind = prog;
  printf("prog: %x \n",prog);
  memcpy((char *)prog,(char *)prog_rel,text_len);
  memcpy((char *)glo_base,(char *)data_rel,data_len);
  printf("entrypoint: %x\n",(prog+entrypoint));
  printf("text_len: %x\n",(text_len));
  printf("data_len: %x\n",(data_len));
  fclose(f);

  int m=global_relocs_table_base+global_reloc_table_len;
  int l;
  int a;
  int n;
  int p;
  for(i=0;i<reloc_len;i=i+12){
    if(relocs_base+i+8==0){
      p=prog;
    } else {
      p=glo;
    }
    w32(prog+r32(relocs_base+i),r32(relocs_base+i+4)+p); 
  }
  int goff=0;
  int off;
  int addr;
  int* addr_ptr;
  while(global_relocs_table<m){
    l=strlen((char *)global_relocs_table);
    a=dlsym(NULL,(char *)global_relocs_table);
    printf("global_reloc: %s %d %x ",global_relocs_table,l,a);
    global_relocs_table+=l+1;
    n=r32(global_relocs_table);
    global_relocs_table+=4;
    printf("global_reloc_num: %d\n",n);
    for(i=0;i<n;i++){
      off=r32(global_relocs_base+goff+4);
      addr=(unsigned int)(off+prog);
      switch(r32(global_relocs_base+goff)) {
        case RELOC_ADDR32:
          printf("Reloc type RELOC_ADDR32 at %x\n",addr);
          addr_ptr = (int*)addr;
          *addr_ptr=a;
          break;
        case RELOC_REL32:
          printf("Reloc type RELOC_REL32 at %x\n",addr);
          addr_ptr = (int*)addr;
          *addr_ptr = a - addr - 4;
          break;
      }
      goff=goff+8;
    }
  }
  return prog+entrypoint;
}

int main(int argc, char **argv)
{
    int (*t)();
    char *p, *r, *outfile;
    int optind;

    optind = 1;
    int loader=0;
    while (1) {
        r = argv[optind];
        if (r[0] != '-')
            break;
        optind++;
        if(r[1] == 'R') {
            t=(int (*)())load_obj();
            loader=1;
        } else {
            fprintf(stderr, "invalid option -- '%s'\n", r);
            exit(1);
        }
    }

  printf("running loader\n");
  return (*t)(argc - optind, argv + optind);
}
