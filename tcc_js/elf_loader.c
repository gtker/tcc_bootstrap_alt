#include "elf_loader_support_tcc.c"

char *elf_buf;

int init_globals(void){
  elf_buf=malloc(256*1024);
}

int ru8(int o) {
  return elf_buf[o] & 0xFF;
}


void elf_hex_dump(int l){
  int i;
  int j;
  int k;
  int off;
  int off_l;
  int v;

  i=0;
  while(i<l) {
    off=int2str(i,16,0);
    off_l=strlen(off);
    for(k=0;k<8-off_l;k=k+1){
      fputc('0',stdout);
    }
    fputs(off,stdout);
    fputs(": ",stdout);
    j=0;
    while(j<8) { 
      v=ru8(i);
      if(v<16) {
        fputc('0', stdout);
      }
      fputs(int2str(v,16,0), stdout);
      v=ru8(i+1);
      if(v<16) {
        fputc('0', stdout);
      }
      fputs(int2str(v,16,0), stdout);
      fputs(" ", stdout);
      i=i+2;
      j=j+1;
    }
    fputs(" ", stdout);
    i=i-16;
    j=0;
    while(j<16) {
      v=ru8(i);
      if(((' ' <= v) !=0) && ((v <= '~')!=0)) {
        fputc(v, stdout);
      } else {
        fputc('.', stdout);
      }
      i=i+1;
      j=j+1;
    }
    fputs("\n",stdout);
  }
  fputs("\n", stdout);
}

int decode_elf(){
  int e_shoff;

  if(ru8(0)!=0x7F) { puts("magic 0");exit(1);}
  if(ru8(1)!='E') { puts("magic 1");exit(1);}
  if(ru8(2)!='L') { puts("magic 2");exit(1);}
  if(ru8(3)!='F') { puts("magic 3");exit(1);}
  puts("ELF magic ok");

}

int load_elf(char *name){
  int f;
  int l;
  int c;
  int i;
  int j;
  int v;
  int k;
  int off_l;
  char *off;
  l=0;
  puts("loading elf file:");
  puts(name);
  f=fopen(name,"rb");
  while((c=fgetc(f)) >= 0){
    elf_buf[l]=c;
    l=l+1;
  }
  puts("file length");
  puts_num(l);
/*  elf_hex_dump(l); */
  decode_elf();
}

int get_main(void){
  char *m;
  m=malloc(1024);
  m[0]=0xB8;
  m[1]=0;
  m[2]=0;
  m[3]=0;
  m[4]=0;
  m[5]=0xC3;
  return m;
}

int main(int argc, char **argv)
{
  FUNCTION t;
  int optind;

  puts("elf loader starting");

  optind = 1;

  init_c();
  init_globals();

  puts("running elf files");
  load_elf("elf_test.o");
  puts(argv[optind]);
  t=get_main();
  return call_wrap(t, argc - optind, argv + (p_size*optind));
}
