/*
 *  X86 code generator for TCC
 * 
 *  Copyright (c) 2001 Fabrice Bellard
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program; if not, write to the Free Software
 *  Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
 */

/* number of available registers */
#define NB_REGS             3

/* a register can belong to several classes */
#define REG_CLASS_INT    0x0001

/* pretty names for the registers */
enum {
    REG_EAX = 0,
    REG_ECX,
    REG_EDX,
};

int reg_classes[NB_REGS] = {
    REG_CLASS_INT,    /* eax */
    REG_CLASS_INT,    /* ecx */
    REG_CLASS_INT,    /* edx */
};

/* integer return register for functions */
#define FUNC_RET_REG        0 

/* pointer size, in bytes */
#define PTR_SIZE 4

/* function call context */
typedef struct GFuncContext {
    int args_size;
} GFuncContext;

/******************************************************/

void g(int c)
{
    char* charind = (char*)ind;
    *charind++ = c;
}

void o(int c)
{
    while (c) {
        g(c);
        c = c / 256;
    }
}

void gen_le32(int c)
{
    g(c);
    g(c >> 8);
    g(c >> 16);
    g(c >> 24);
}

/* add a new relocation entry to symbol 's' */
void greloc(Sym *s, int addr, int type)
{
    Reloc *p;
    p = malloc(sizeof(Reloc));
    if (!p)
        error("memory full");
    p->type = type;
    p->addr = addr;
    p->next = (Reloc *)s->c;
    s->c = (int)p;
}

int is_prog(int a){
  if(((unsigned int)(a-prog))<(TEXT_SIZE)){
    return 1;
  }
  return 0;

}

int is_data(int a){
  if(((unsigned int)(a-glo_base))<(DATA_SIZE)){
    return 1;
  }
  return 0;
}

void mk_reloc(int addr,int val){
    int* intrelocs = (int*)relocs;
    if(val==0){
      return;
    }
    if(is_prog(addr)){
      intrelocs = (int*)relocs;
      *intrelocs=addr-prog;
      relocs=relocs+4;
    } else {
      printf("Can't handle relocs in data\n");
      exit(1);
    }


    if(is_data(val)){
      intrelocs = (int*)relocs;
      *intrelocs=val-glo_base;
      relocs=relocs+4;
      intrelocs = (int*)relocs;
      *intrelocs=0;
      relocs=relocs+4;
    } else {
      intrelocs = (int*)relocs;
      *intrelocs=val-prog;
      relocs=relocs+4;
      intrelocs = (int*)relocs;
      *intrelocs=1;
      relocs=relocs+4;
    }
//   printf("val: %d %d\n",val,is_data(val));
}

void mk_reloc_global(int type,int addr){
//return;
printf("mk_reloc_global: %d\n",global_relocs);
  int* intglobal_relocs = (int*)global_relocs;
  *intglobal_relocs=type;
  global_relocs+=4;
  intglobal_relocs = (int*)global_relocs;
  *intglobal_relocs=addr-prog;
  global_relocs+=4;
}

/* patch each relocation entry with value 'val' */
int greloc_patch(Sym *s, int val)
{
    Reloc *p, *p1;
    int* intpaddr;
int count=0;
    p = (Reloc *)s->c;
    while (p != NULL) {
count++;
        p1 = p->next;
        switch(p->type) {
        case RELOC_ADDR32:
if(reloc){
  printf("reloc at: 0x%x to: 0x%x\n",p->addr,val);
  if(reloc_global){
mk_reloc_global(RELOC_ADDR32,p->addr);
//    global_relocs=global_relocs+12;
  } else {
printf("shouldn't get here\n");
exit(1);
//    mk_reloc(p->addr,val);
  }
}
            intpaddr = (int*)p->addr;
            *intpaddr = val;
            break;
        case RELOC_REL32:
if(reloc_global && relocs){
  printf("reloc4: 0x%x to: 0x%x\n",p->addr,val);
mk_reloc_global(RELOC_REL32,p->addr);
//  global_relocs=global_relocs+12;

}
            intpaddr = (int*)p->addr;
            *intpaddr = val - p->addr - 4;
            break;
        }
        free(p);
        p = p1;
    }
    s->c = val;
    s->t &= ~VT_FORWARD;
return count;
}

/* output a symbol and patch all calls to it */
void gsym_addr(t, a)
{
    int n;
    int* intt;
    while (t) {
        intt = (int*)t;
        n = *intt; /* next value */
        *intt = a - t - 4;
        t = n;
    }
}

void gsym(t)
{
    gsym_addr(t, ind);
}

/* psym is used to put an instruction with a data field which is a
   reference to a symbol. It is in fact the same as oad ! */
#define psym oad

/* instruction + 4 bytes data. Return the address of the data */
int oad(int c, int s)
{
    o(c);
    int* intind = (int*)ind;
    *intind = s;
    s = ind;
    ind = ind + 4;
    return s;
}

int lt=0;

/* output constant with relocation if 't & VT_FORWARD' is true */
void gen_addr32(int c, int t)
{
    if (!(t & VT_FORWARD)) {

// RELOC HACK
if(reloc){
//  printf("\nreloc2: at: %x to: %x\n",ind,(c-glo_base));
  if((t==VT_CONST) || (t==138)){
    printf("\nreloc2: integer constant or enum");
    printf("\nreloc3: at: 0x%x to: 0x%x\n",ind,c);
  } else {
    printf("\nreloc2: at: 0x%x to: 0x%x\n",ind,c);
if(reloc_global){
printf("relocs error\n");
  exit(1);
}
    mk_reloc(ind,c);
  }
}
        gen_le32(c);
    } else {
        greloc((Sym *)c, ind, RELOC_ADDR32);
        gen_le32(0);
    }
}

/* XXX: generate correct pointer for forward references to functions */
/* r = (ft, fc) */
void load(int r, int ft, int fc)
{
    int v, t;

    v = ft & VT_VALMASK;
    if (ft & VT_LVAL) {
        if (v == VT_LLOCAL) {
            load(r, VT_LOCAL | VT_LVAL, fc);
            v = r;
        }
        if ((ft & VT_TYPE) == VT_BYTE)
            o(0xbe0f);   /* movsbl */
        else if ((ft & VT_TYPE) == (VT_BYTE | VT_UNSIGNED))
            o(0xb60f);   /* movzbl */
        else if ((ft & VT_TYPE) == VT_SHORT)
            o(0xbf0f);   /* movswl */
        else if ((ft & VT_TYPE) == (VT_SHORT | VT_UNSIGNED))
            o(0xb70f);   /* movzwl */
        else
            o(0x8b);     /* movl */

        if (v == VT_CONST) {
            o(0x05 + r * 8); /* 0xXX, r */
// DEBUG LOGGING
// printf("\n load1 %x\n",ind);
lt=1;
            gen_addr32(fc, ft);
        } else if (v == VT_LOCAL) {
            oad(0x85 + r * 8, fc); /* xx(%ebp), r */
        } else {
            g(0x00 + r * 8 + v); /* (v), r */
        }
    } else {
        if (v == VT_CONST) {
            o(0xb8 + r); /* mov $xx, r */
// DEBUG LOGGING
// printf("\n load2 %x\n",ind);
lt=2;
            gen_addr32(fc, ft);
        } else if (v == VT_LOCAL) {
            o(0x8d);
            oad(0x85 + r * 8, fc); /* lea xxx(%ebp), r */
        } else if (v == VT_CMP) {
            oad(0xb8 + r, 0); /* mov $0, r */
            o(0x0f); /* setxx %br */
            o(fc);
            o(0xc0 + r);
        } else if (v == VT_JMP || v == VT_JMPI) {
            t = v & 1;
            oad(0xb8 + r, t); /* mov $1, r */
            oad(0xe9, 5); /* jmp after */
            gsym(fc);
            oad(0xb8 + r, t ^ 1); /* mov $0, r */
        } else if (v != r) {
            o(0x89);
            o(0xc0 + r + v * 8); /* mov v, r */
        }
    }
}

/* (ft, fc) = r */
/* WARNING: r must not be allocated on the stack */
void store(r, ft, fc)
{
    int fr, bt;

    fr = ft & VT_VALMASK;
    bt = ft & VT_BTYPE;

    if (bt == VT_SHORT)
        o(0x66);
    if (bt == VT_BYTE)
        o(0x88);
    else
        o(0x89);
    if (fr == VT_CONST) {
        o(0x05 + r * 8); /* mov r,xxx */
lt=1;
// DEBUG LOGGING
// printf("\nstore 32 ind: %x\n",ind);
        gen_addr32(fc, ft);
    } else if (fr == VT_LOCAL) {
        oad(0x85 + r * 8, fc); /* mov r,xxx(%ebp) */
    } else if (ft & VT_LVAL) {
        g(fr + r * 8); /* mov r, (fr) */
    } else if (fr != r) {
        o(0xc0 + fr + r * 8); /* mov r, fr */
    }
}

/* start function call and return function call context */
void gfunc_start(GFuncContext *c)
{
    c->args_size = 0;
}

/* push function parameter which is in (vtop->t, vtop->c). Stack entry
   is then popped. */
void gfunc_param(GFuncContext *c)
{
    int size, align, r;

    if ((vtop->t & (VT_BTYPE | VT_LVAL)) == (VT_STRUCT | VT_LVAL)) {
        size = type_size(vtop->t, &align);
        /* align to stack align size */
        size = (size + 3) & ~3;
        /* allocate the necessary size on stack */
        oad(0xec81, size); /* sub $xxx, %esp */
        /* generate structure store */
        r = get_reg(REG_CLASS_INT);
        o(0x89); /* mov %esp, r */
        o(0xe0 + r);
        vset(VT_INT | r, 0);
        vswap();
        vstore();
        c->args_size += size;
    } else {
        /* simple type (currently always same size) */
        /* XXX: implicit cast ? */
        r = gv();
        o(0x50 + r); /* push r */
        c->args_size += 4;
    }
    vtop--;
}

/* generate function call with address in (vtop->t, vtop->c) and free function
   context. Stack entry is popped */
void gfunc_call(GFuncContext *c)
{
    int r;
    if ((vtop->t & (VT_VALMASK | VT_LVAL)) == VT_CONST) {
        /* constant case */
        /* forward reference */
        if (vtop->t & VT_FORWARD) {
            greloc(vtop->c.sym, ind + 1, RELOC_REL32);
            oad(0xe8, 0);
        } else {
// HACK ljw
if(special) {
printf("gfunc_call: %x %x\n",ind,vtop->c.ul - ind - 5);
  char *str="memcpy";
  strcpy((char *)global_relocs_table,str);
  global_relocs_table+=strlen(str)+1;
  int* intrelocs = (int*)global_relocs_table;
  *intrelocs=1;
  global_relocs_table+=4;
  intrelocs = (int*)global_relocs;
  *intrelocs=RELOC_REL32;
  global_relocs+=4;
  intrelocs = (int*)global_relocs;
  *intrelocs=ind+1-prog;
  global_relocs+=4;

}
            oad(0xe8, vtop->c.ul - ind - 5);
        }
    } else {
        /* otherwise, indirect call */
        r = gv();
        o(0xff); /* call *r */
        o(0xd0 + r);
    }
    if (c->args_size)
        oad(0xc481, c->args_size); /* add $xxx, %esp */
    vtop--;
}

int gjmp(int t)
{
    return psym(0xe9, t);
}

/* generate a test. set 'inv' to invert test. Stack entry is popped */
int gtst(int inv, int t)
{
    int v, *p;
    v = vtop->t & VT_VALMASK;
    if (v == VT_CMP) {
        /* fast case : can jump directly since flags are set */
        g(0x0f);
        t = psym((vtop->c.i - 16) ^ inv, t);
    } else if (v == VT_JMP || v == VT_JMPI) {
        /* && or || optimization */
        if ((v & 1) == inv) {
            /* insert vtop->c jump list in t */
            p = &vtop->c.i;
            while (*p != 0)
                p = (int *)*p;
            *p = t;
            t = vtop->c.i;
        } else {
            t = gjmp(t);
            gsym(vtop->c.i);
        }
    } else if ((vtop->t & (VT_VALMASK | VT_LVAL)) == VT_CONST) {
        /* constant jmp optimization */
        if ((vtop->c.i != 0) != inv) 
            t = gjmp(t);
    } else {
        /* XXX: floats */
        v = gv();
        o(0x85);
        o(0xc0 + v * 9);
        g(0x0f);
        t = psym(0x85 ^ inv, t);
    }
    vtop--;
    return t;
}

/* generate an integer binary operation */
void gen_opi(int op)
{
    int t, r, fr;

    vswap();
    r = gv();
    vswap();
    fr = gv();
    vtop--;

    if (op == '+') {
        o(0x01);
        o(0xc0 + r + fr * 8); 
    } else if (op == '-') {
        o(0x29);
        o(0xc0 + r + fr * 8); 
    } else if (op == '&') {
        o(0x21);
        o(0xc0 + r + fr * 8); 
    } else if (op == '^') {
        o(0x31);
        o(0xc0 + r + fr * 8); 
    } else if (op == '|') {
        o(0x09);
        o(0xc0 + r + fr * 8); 
    } else if (op == '*') {
        o(0xaf0f); /* imul fr, r */
        o(0xc0 + fr + r * 8);
    } else if (op == TOK_SHL | op == TOK_SHR | op == TOK_SAR) {
        /* op2 is %ecx */
        if (fr != 1) {
            if (r == 1) {
                r = fr;
                fr = 1;
                o(0x87); /* xchg r, %ecx */
                o(0xc1 + r * 8);
            } else
                move_reg(1, fr);
        }
        o(0xd3); /* shl/shr/sar %cl, r */
        if (op == TOK_SHL) 
            o(0xe0 + r);
        else if (op == TOK_SHR)
            o(0xe8 + r);
        else
            o(0xf8 + r);
        vtop->t = (vtop->t & VT_TYPE) | r;
    } else if (op == '/' | op == TOK_UDIV | op == TOK_PDIV | 
               op == '%' | op == TOK_UMOD) {
        save_reg(2); /* save edx */
        t = save_reg_forced(fr); /* save fr and get op2 location */
        move_reg(0, r); /* op1 is %eax */
        if (op == TOK_UDIV | op == TOK_UMOD) {
            o(0xf7d231); /* xor %edx, %edx, div t(%ebp), %eax */
            oad(0xb5, t);
        } else {
            o(0xf799); /* cltd, idiv t(%ebp), %eax */
            oad(0xbd, t);
        }
        if (op == '%' | op == TOK_UMOD)
            r = 2;
        else
            r = 0;
        vtop->t = (vtop->t & VT_TYPE) | r;
    } else {
        vtop--;
        o(0x39);
        o(0xc0 + r + fr * 8); /* cmp fr, r */
        vset(VT_CMP, op);
    }
}

/* pop stack value */
void vpop(void)
{
    vtop--;
}



/* end of X86 code generator */
/*************************************************************/

