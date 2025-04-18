/*
 *  TCC - Tiny C Compiler
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

/* these sizes are dummy for unix, because malloc() does not use
   memory when the pages are not used */
#define TEXT_SIZE           (256*1024)
#define DATA_SIZE           (256*1024)

#define INCLUDE_STACK_SIZE  32
#define IFDEF_STACK_SIZE    64
#define VSTACK_SIZE         64
#define STRING_MAX_SIZE     1024
#define INCLUDE_PATHS_MAX   32

#define TOK_HASH_SIZE       521
#define TOK_ALLOC_INCR      256 /* must be a power of two */
#define SYM_HASH_SIZE       263

/* token symbol management */
typedef struct TokenSym {
    struct TokenSym *hash_next;
    int tok; /* token number */
    int len;
    char str[1];
} TokenSym;

/* constant value */
typedef union CValue {
    int i;
    unsigned int ui;
    unsigned int ul; /* address (should be unsigned long on 64 bit cpu) */
    struct TokenSym *ts;
    int tab[1];
    struct Sym *sym;
} CValue;

/* value on stack */
typedef struct SValue {
    int t;
    CValue c;
} SValue;

/* symbol management */
typedef struct Sym {
    int v;    /* symbol token */
    int t;    /* associated type */
    int c;    /* associated number */
    struct Sym *next; /* next related symbol */
    struct Sym *prev; /* prev symbol in stack */
    struct Sym *hash_next; /* next symbol in hash table */
} Sym;

typedef struct SymStack {
  struct Sym *top;
  struct Sym *hash[SYM_HASH_SIZE];
} SymStack;

/* relocation entry (currently only used for functions or variables */
typedef struct Reloc {
    int type;            /* type of relocation */
    int addr;            /* address of relocation */
    struct Reloc *next;  /* next relocation */
} Reloc;

#define RELOC_ADDR32 1  /* 32 bits relocation */
#define RELOC_REL32  2  /* 32 bits relative relocation */


#define SYM_STRUCT     0x40000000 /* struct/union/enum symbol space */
#define SYM_FIELD      0x20000000 /* struct/union field symbol space */
#define SYM_FIRST_ANOM (1 << (31 - VT_STRUCT_SHIFT)) /* first anonymous sym */

#define FUNC_NEW       1 /* ansi function prototype */
#define FUNC_OLD       2 /* old function prototype */
#define FUNC_ELLIPSIS  3 /* ansi function prototype with ... */

/* field 'Sym.t' for macros */
#define MACRO_OBJ      0 /* object like macro */
#define MACRO_FUNC     1 /* function like macro */

/* type_decl() types */
#define TYPE_ABSTRACT  1 /* type without variable */
#define TYPE_DIRECT    2 /* type with variable */

typedef struct {
    FILE *file;
    char *filename;
    int line_num;
} IncludeFile;

int special=0;

/* parser */
FILE *file;
int line_num;
int ch, ch1, tok, tok1;
CValue tokc, tok1c;

/* loc : local variable index
   glo : global variable index
   ind : output code ptr
   rsym: return symbol
   prog: output code
   anon_sym: anonymous symbol index
*/
int rsym, anon_sym,
    prog, ind, loc, glo, const_wanted, glo_base;
int global_expr; /* true if compound literals must be allocated
                    globally (used during initializers parsing */
int func_vt, func_vc; /* current function return type (used by
                         return instruction) */
int tok_ident;
TokenSym **table_ident;
TokenSym *hash_ident[TOK_HASH_SIZE];
char token_buf[STRING_MAX_SIZE + 1];
char *filename, *funcname;
/* contains global symbols which remain between each translation unit */
SymStack extern_stack;
SymStack define_stack, global_stack, local_stack, label_stack;

SValue vstack[VSTACK_SIZE], *vtop;
int *macro_ptr, *macro_ptr_allocated;
IncludeFile include_stack[INCLUDE_STACK_SIZE], *include_stack_ptr;
int ifdef_stack[IFDEF_STACK_SIZE], *ifdef_stack_ptr;
char *include_paths[INCLUDE_PATHS_MAX];
int nb_include_paths;

/* use GNU C extensions */
int gnu_ext = 0;

/* use Tiny C extensions */
int tcc_ext = 1;

int reloc=0;
int reloc_global=0;

int relocs;
int relocs_base;

int global_relocs;
int global_relocs_base;

int global_relocs_table;
int global_relocs_table_base;

/* The current value can be: */
#define VT_VALMASK 0x000f
#define VT_CONST   0x000a  /* constant in vc 
                              (must be first non register value) */
#define VT_LLOCAL  0x000b  /* lvalue, offset on stack */
#define VT_LOCAL   0x000c  /* offset on stack */
#define VT_CMP     0x000d  /* the value is stored in processor flags (in vc) */
#define VT_JMP     0x000e  /* value is the consequence of jmp true */
#define VT_JMPI    0x000f  /* value is the consequence of jmp false */
#define VT_LVAL    0x0010  /* var is an lvalue */
#define VT_LVALN   -17         /* ~VT_LVAL */
#define VT_FORWARD 0x0020  /* value is forward reference 
                              (only used for functions) */
/* storage */
#define VT_EXTERN  0x00000040  /* extern definition */
#define VT_STATIC  0x00000080  /* static variable */
#define VT_TYPEDEF 0x00000100  /* typedef definition */

/* types */
#define VT_STRUCT_SHIFT 16   /* structure/enum name shift (16 bits left) */

#define VT_BTYPE_SHIFT 9
#define VT_INT        (0 << VT_BTYPE_SHIFT)  /* integer type */
#define VT_BYTE       (1 << VT_BTYPE_SHIFT)  /* signed byte type */
#define VT_SHORT      (2 << VT_BTYPE_SHIFT)  /* short type */
#define VT_VOID       (3 << VT_BTYPE_SHIFT)  /* void type */
#define VT_PTR        (4 << VT_BTYPE_SHIFT)  /* pointer increment */
#define VT_ENUM       (5 << VT_BTYPE_SHIFT)  /* enum definition */
#define VT_FUNC       (6 << VT_BTYPE_SHIFT)  /* function type */
#define VT_STRUCT     (7 << VT_BTYPE_SHIFT)  /* struct/union definition */
#define VT_FLOAT      (8 << VT_BTYPE_SHIFT)  /* IEEE float */
#define VT_DOUBLE     (9 << VT_BTYPE_SHIFT)  /* IEEE double */
#define VT_LDOUBLE   (10 << VT_BTYPE_SHIFT)  /* IEEE long double */
#define VT_BOOL      (11 << VT_BTYPE_SHIFT)  /* ISOC99 boolean type */
#define VT_LLONG     (12 << VT_BTYPE_SHIFT)  /* 64 bit integer */
#define VT_LONG      (13 << VT_BTYPE_SHIFT)  /* long integer (NEVER
                                                USED as type, only
                                                during parsing) */
#define VT_BTYPE      (0xf << VT_BTYPE_SHIFT) /* mask for basic type */
#define VT_UNSIGNED   (0x10 << VT_BTYPE_SHIFT)  /* unsigned type */
#define VT_ARRAY      (0x20 << VT_BTYPE_SHIFT)  /* array type (also has VT_PTR) */
#define VT_BITFIELD   (0x40 << VT_BTYPE_SHIFT)  /* bitfield modifier */

#define VT_TYPE    0xfffffe00  /* type mask */

/* token values */

/* warning: the following compare tokens depend on i386 asm code */
#define TOK_ULT 0x92
#define TOK_UGE 0x93
#define TOK_EQ  0x94
#define TOK_NE  0x95
#define TOK_ULE 0x96
#define TOK_UGT 0x97
#define TOK_LT  0x9c
#define TOK_GE  0x9d
#define TOK_LE  0x9e
#define TOK_GT  0x9f

#define TOK_LAND  0xa0
#define TOK_LOR   0xa1

#define TOK_DEC   0xa2
#define TOK_MID   0xa3 /* inc/dec, to void constant */
#define TOK_INC   0xa4
#define TOK_ARROW 0xa7 
#define TOK_DOTS  0xa8 /* three dots */
#define TOK_SHR   0xa9 /* unsigned shift right */
#define TOK_UDIV  0xb0 /* unsigned division */
#define TOK_UMOD  0xb1 /* unsigned modulo */
#define TOK_PDIV  0xb2 /* fast division with undefined rounding for pointers */
#define TOK_NUM   0xb3 /* number in tokc */
#define TOK_CCHAR 0xb4 /* char constant in tokc */
#define TOK_STR   0xb5 /* pointer to string in tokc */
#define TOK_TWOSHARPS 0xb6 /* ## preprocessing token */
#define TOK_LCHAR 0xb7
#define TOK_LSTR  0xb8
#define TOK_CFLOAT   0xb9 /* float constant */
#define TOK_CDOUBLE  0xc0 /* double constant */
#define TOK_CLDOUBLE 0xc1 /* long double constant */

 #define TOK_SHL   0x01 /* shift left */
#define TOK_SAR   0x02 /* signed shift right */
  
/* assignement operators : normal operator or 0x80 */
#define TOK_A_MOD 0xa5
#define TOK_A_AND 0xa6
#define TOK_A_MUL 0xaa
#define TOK_A_ADD 0xab
#define TOK_A_SUB 0xad
#define TOK_A_DIV 0xaf
#define TOK_A_XOR 0xde
#define TOK_A_OR  0xfc
#define TOK_A_SHL 0x81
#define TOK_A_SAR 0x82

/* all identificators and strings have token above that */
#define TOK_IDENT 256

enum {
    TOK_INT = TOK_IDENT,
    TOK_VOID,
    TOK_CHAR,
    TOK_IF,
    TOK_ELSE,
    TOK_WHILE,
    TOK_BREAK,
    TOK_RETURN,
    TOK_FOR,
    TOK_EXTERN,
    TOK_STATIC,
    TOK_UNSIGNED,
    TOK_GOTO,
    TOK_DO,
    TOK_CONTINUE,
    TOK_SWITCH,
    TOK_CASE,

    /* ignored types Must have contiguous values */
    TOK_CONST,
    TOK_VOLATILE,
    TOK_LONG,
    TOK_REGISTER,
    TOK_SIGNED,
    TOK_AUTO,
    TOK_INLINE,
    TOK_RESTRICT,

    /* unsupported type */
    TOK_FLOAT,
    TOK_DOUBLE,
    TOK_BOOL,

    TOK_SHORT,
    TOK_STRUCT,
    TOK_UNION,
    TOK_TYPEDEF,
    TOK_DEFAULT,
    TOK_ENUM,
    TOK_SIZEOF,

    /* preprocessor only */
    TOK_UIDENT, /* first "user" ident (not keyword) */
    TOK_DEFINE = TOK_UIDENT,
    TOK_INCLUDE,
    TOK_IFDEF,
    TOK_IFNDEF,
    TOK_ELIF,
    TOK_ENDIF,
    TOK_DEFINED,
    TOK_UNDEF,
    TOK_ERROR,
    TOK_LINE,
    TOK___LINE__,
    TOK___FILE__,
    TOK___DATE__,
    TOK___TIME__,
    TOK___VA_ARGS__,

    /* special identifiers */
    TOK___FUNC__,
    TOK_MAIN,
};

void sum(int l);
void next(void);
void next_nomacro(void);
int expr_const(void);
void expr_eq(void);
void gexpr(void);
void decl(int l);
void decl_initializer(int t, int c, int first, int size_only);
int decl_initializer_alloc(int t, int has_init);
int gv(void);
void move_reg(int r, int s);
void save_reg(int r);
void vpop(void);
void vswap(void);
void vdup(void);
int get_reg(int rc);

void macro_subst(int **tok_str, int *tok_len, 
                 Sym **nested_list, int *macro_str);
int save_reg_forced(int r);
void gen_op(int op);
void gen_cast(int t);
void vstore(void);
int type_size(int t, int *a);
int pointed_type(int t);
int pointed_size(int t);
int ist(void);
int type_decl(int *v, int t, int td);
void error(const char *fmt, ...);
void vset(int t, int v);
void printline2(void);

#include "i386-gen.c"

static inline int isid(int c)
{
    return (c >= 'a' && c <= 'z') ||
        (c >= 'A' && c <= 'Z') ||
        c == '_';
}

static inline int isnum(int c)
{
    return c >= '0' & c <= '9';
}

static inline int toup(int c)
{
    if (ch >= 'a' && ch <= 'z')
        return ch - 'a' + 'A';
    else
        return ch;
}

void printline(void)
{
    IncludeFile *f;
    for(f = include_stack; f < include_stack_ptr; f++)
        fprintf(stderr, "In file included from %s:%d:\n", 
                f->filename, f->line_num);
    fprintf(stderr, "%s:%d: ", filename, line_num);
}

void printline2(void)
{
    IncludeFile *f;
    for(f = include_stack; f < include_stack_ptr; f++)
        fprintf(stdout, "In file included from %s:%d:\n", 
                f->filename, f->line_num);
    fprintf(stdout, "%s:%d: ", filename, line_num);
}

void error(const char *fmt, ...)
{
    va_list ap;
    va_start(ap, fmt);
    printline();
    vfprintf(stderr, fmt, ap);
    fprintf(stderr, "\n");
    exit(1);
//    va_end(ap);
}

void expect(const char *msg)
{
    error("%s expected", msg);
}

void warning(const char *msg)
{
    printline();
    fprintf(stderr, "warning: %s\n", msg);
}

void skip(int c)
{
    if (tok != c)
        error("'%c' expected", c);
    next();
}

void test_lvalue(void)
{
    if (!(vtop->t & VT_LVAL))
        expect("lvalue");
}

TokenSym *tok_alloc(char *str, int len)
{
    TokenSym *ts, **pts, **ptable;
    int h, i;
    
    if (len <= 0)
        len = strlen(str);
    h = 1;
    for(i=0;i<len;i++)
        h = ((h << 8) | (str[i] & 0xff)) % TOK_HASH_SIZE;

    pts = &hash_ident[h];
    while (1) {
        ts = *pts;
        if (!ts)
            break;
        if (ts->len == len && !memcmp(ts->str, str, len))
            return ts;
        pts = &(ts->hash_next);
    }

    if (tok_ident >= SYM_FIRST_ANOM) 
        error("memory full");

    /* expand token table if needed */
    i = tok_ident - TOK_IDENT;
    if ((i % TOK_ALLOC_INCR) == 0) {
        ptable = realloc(table_ident, (i + TOK_ALLOC_INCR) * sizeof(TokenSym *));
        if (!ptable)
            error("memory full");
        table_ident = ptable;
    }

    ts = malloc(sizeof(TokenSym) + len);
    if (!ts)
        error("memory full");
    table_ident[i] = ts;
    ts->tok = tok_ident++;
    ts->len = len;
    ts->hash_next = NULL;
    memcpy(ts->str, str, len + 1);
    *pts = ts;
    return ts;
}

void add_char(char **pp, int c)
{
    char *p;
    p = *pp;
    if (c == '\'' || c == '\"' || c == '\\') {
        /* XXX: could be more precise if char or string */
        *p++ = '\\';
    }
    if (c >= 32 && c <= 126) {
        *p++ = c;
    } else {
        *p++ = '\\';
        if (c == '\n') {
            *p++ = 'n';
        } else {
            *p++ = '0' + ((c >> 6) & 7);
            *p++ = '0' + ((c >> 3) & 7);
            *p++ = '0' + (c & 7);
        }
    }
    *pp = p;
}

/* XXX: buffer overflow */
char *get_tok_str(int v, CValue *cv)
{
    static char buf[STRING_MAX_SIZE + 1];
    TokenSym *ts;
    char *p;
    int i;

    if (v == TOK_NUM) {
        sprintf(buf, "%u", cv->ui);
        return buf;
    } else if (v == TOK_CCHAR || v == TOK_LCHAR) {
        p = buf;
        *p++ = '\'';
        add_char(&p, cv->i);
        *p++ = '\'';
        *p = '\0';
        return buf;
    } else if (v == TOK_STR || v == TOK_LSTR) {
        ts = cv->ts;
        p = buf;
        *p++ = '\"';
        for(i=0;i<ts->len;i++)
            add_char(&p, ts->str[i]);
        *p++ = '\"';
        *p = '\0';
        return buf;
    } else if (v < TOK_IDENT) {
        p = buf;
        *p++ = v;
        *p = '\0';
        return buf;
    } else if (v < tok_ident) {
        return table_ident[v - TOK_IDENT]->str;
    } else {
        /* should never happen */
        return NULL;
    }
}

/* push, without hashing */
Sym *sym_push2(Sym **ps, int v, int t, int c)
{
    Sym *s;
    s = malloc(sizeof(Sym));
    if (!s)
        error("memory full");
    s->v = v;
    s->t = t;
    s->c = c;
    s->next = NULL;
    /* add in stack */
    s->prev = *ps;
    *ps = s;
    return s;
}

/* find a symbol and return its associated structure. 's' is the top
   of the symbol stack */
Sym *sym_find2(Sym *s, int v)
{
    while (s) {
        if (s->v == v)
            return s;
        s = s->prev;
    }
    return NULL;
}

unsigned int HASH_SYM(int v) {
    return ((unsigned)(v) % SYM_HASH_SIZE);
}

/* find a symbol and return its associated structure. 'st' is the
   symbol stack */
Sym *sym_find1(SymStack *st, int v)
{
    Sym *s;

    s = st->hash[HASH_SYM(v)];
    while (s) {
        if (s->v == v)
            return s;
        s = s->hash_next;
    }
    return 0;
}

Sym *sym_push1(SymStack *st, int v, int t, int c)
{
    Sym *s, **ps;
    s = sym_push2(&st->top, v, t, c);
    /* add in hash table */
    if (v) {
        ps = &st->hash[HASH_SYM(v)];
        s->hash_next = *ps;
        *ps = s;
    }
    return s;
}

/* find a symbol in the right symbol space */
Sym *sym_find(int v)
{
    Sym *s;
    s = sym_find1(&local_stack, v);
    if (!s)
        s = sym_find1(&global_stack, v);
    return s;
}

/* push a given symbol on the symbol stack */
Sym *sym_push(int v, int t, int c)
{
    if (local_stack.top)
        return sym_push1(&local_stack, v, t, c);
    else
        return sym_push1(&global_stack, v, t, c);
}

/* pop symbols until top reaches 'b' */
void sym_pop(SymStack *st, Sym *b)
{
    Sym *s, *ss;

    s = st->top;
    while(s != b) {
        ss = s->prev;
        /* free hash table entry, except if symbol was freed (only
           used for #undef symbols) */
        if (s->v)
            st->hash[HASH_SYM(s->v)] = s->hash_next;
        free(s);
        s = ss;
    }
    st->top = b;
}

/* undefined a hashed symbol (used for #undef). Its name is set to
   zero */
void sym_undef(SymStack *st, Sym *s)
{
    Sym **ss;
    ss = &st->hash[HASH_SYM(s->v)];
    while (*ss != NULL) {
        if (*ss == s)
            break;
        ss = &(*ss)->hash_next;
    }
    *ss = s->hash_next;
    s->v = 0;
}

/* no need to put that inline */
int handle_eof(void)
{
    if (include_stack_ptr == include_stack)
        return -1;
    /* pop include stack */
    fclose(file);
    free(filename);
    include_stack_ptr--;
    file = include_stack_ptr->file;
    filename = include_stack_ptr->filename;
    line_num = include_stack_ptr->line_num;
    return 0;
}

/* read next char from current input file */
static inline void inp(void)
{
    int redo=1;
    while(redo){
        redo=0;
        /* faster than fgetc */
        ch1 = getc_unlocked(file);
        if (ch1 == -1) {
            if (handle_eof() < 0)
                return;
            else
                redo=1;
        }
    }
// DEBUG LOGGING
//    printf("%c",ch1);
    if (ch1 == '\n')
        line_num++;
    //    printf("ch1=%c 0x%x\n", ch1, ch1);
}

/* input with '\\n' handling */
static inline void minp(void)
{
    int redo=1;
    while(redo){
        redo=0;
        ch = ch1;
        inp();
        if (ch == '\\' && ch1 == '\n') {
            inp();
            redo=1;
        }
    }
    //printf("ch=%c 0x%x\n", ch, ch);
}


/* same as minp, but also skip comments */
void cinp(void)
{
    int c;

    if (ch1 == '/') {
        inp();
        if (ch1 == '/') {
            /* single line C++ comments */
            inp();
            while (ch1 != '\n' && ch1 != -1)
                inp();
            inp();
            ch = ' '; /* return space */
        } else if (ch1 == '*') {
            /* C comments */
            inp();
            while (ch1 != -1) {
                c = ch1;
                inp();
            if (c == '*' && ch1 == '/') {
                inp();
                ch = ' '; /* return space */
                break;
            }
            }
        } else {
            ch = '/';
        }
    } else {
        minp();
    }
}

void skip_spaces(void)
{
    while (ch == ' ' || ch == '\t')
        cinp();
}

/* return the number of additionnal 'ints' necessary to store the
   token */
static inline int tok_ext_size(int t)
{
    switch(t) {
        /* 4 bytes */
    case TOK_NUM:
    case TOK_CCHAR:
    case TOK_LCHAR:
    case TOK_STR:
    case TOK_LSTR:
    case TOK_CFLOAT:
        return 1;
    case TOK_CDOUBLE:
        return 2;
    default:
        return 0;
    }
}

void tok_add(int **tok_str, int *tok_len, int t)
{
    int len, *str;
    len = *tok_len;
    str = *tok_str;
    if ((len & 63) == 0) {
        str = realloc(str, (len + 64) * sizeof(int));
        if (!str)
            return;
        *tok_str = str;
    }
    str[len++] = t;
    *tok_len = len;
}

void tok_add2(int **tok_str, int *tok_len, int t, CValue *cv)
{
    int n, i;

    tok_add(tok_str, tok_len, t);
    n = tok_ext_size(t);
    for(i=0;i<n;i++)
        tok_add(tok_str, tok_len, cv->tab[i]);
}

/* get a token from an integer array and increment pointer accordingly */
int tok_get(int **tok_str, CValue *cv)
{
    int *p, t, n, i;

    p = *tok_str;
    t = *p++;
    n = tok_ext_size(t);
    for(i=0;i<n;i++)
        cv->tab[i] = *p++;
    *tok_str = p;
    return t;
}

/* XXX: should be more factorized */
void define_symbol(char *sym)
{
    TokenSym *ts;
    int *str, len;
    CValue cval;

    ts = tok_alloc(sym, 0);
    str = NULL;
    len = 0;
    cval.i = 1;
    tok_add2(&str, &len, TOK_NUM, &cval);
    tok_add(&str, &len, 0);
    sym_push1(&define_stack, ts->tok, MACRO_OBJ, (int)str);
}

void preprocess(void)
{
    int size, i, c, v, t, *str, len;
    int found=0;
    char buf[1024], *q, *p;
    char buf1[1024];
    FILE *f;
    Sym **ps, *first, *s;

    cinp();
    next_nomacro();
    if (tok == TOK_DEFINE) {
        next_nomacro();
        v = tok;
        /* XXX: should check if same macro (ANSI) */
        first = NULL;
        t = MACRO_OBJ;
        str = NULL;
        len = 0;
        while (1) {
            skip_spaces();
            if (ch == '\n' || ch == -1)
                break;
            next_nomacro();
            tok_add2(&str, &len, tok, &tokc);
        }
        tok_add(&str, &len, 0);
        s = sym_push1(&define_stack, v, t, (int)str);
        s->next = first;
    } else if (tok == TOK_UNDEF) {
        next_nomacro();
        s = sym_find1(&define_stack, tok);
        /* undefine symbol by putting an invalid name */
        if (s)
            sym_undef(&define_stack, s);
    } else if (tok == TOK_INCLUDE) {
        skip_spaces();
        if ((ch == '<') || (ch == '\"')) {
            c = '>';
        if (ch == '\"')
            c = ch;
            minp();
            q = buf;
            while (ch != c && ch != '\n' && ch != -1) {
                if ((q - buf) < sizeof(buf) - 1)
                    *q++ = ch;
                minp();
            }
            *q = '\0';
        } else {
            next();
            if (tok != TOK_STR)
                error("#include syntax error");
            /* XXX: buffer overflow */
            strcpy(buf, get_tok_str(tok, &tokc));
            c = '\"';
        }
        /* eat all spaces and comments after include */
        /* XXX: slightly incorrect */
        while (ch1 != '\n' && ch1 != -1)
            inp();

        if (include_stack_ptr >= include_stack + INCLUDE_STACK_SIZE)
            error("memory full");
        if (c == '\"') {
            /* first search in current dir if "header.h" */
            /* XXX: buffer overflow */
            size = 0;
            p = strrchr(filename, '/');
            if (p) 
                size = p + 1 - filename;
            memcpy(buf1, filename, size);
            buf1[size] = '\0';
            strcat(buf1, buf);
            f = fopen(buf1, "r");
            if (f)
                found=1;
        }
        /* now search in standard include path */
        if(!found){
            for(i=nb_include_paths - 1;i>=0;i--) {
                strcpy(buf1, include_paths[i]);
                strcat(buf1, "/");
                strcat(buf1, buf);
                f = fopen(buf1, "r");
                if (f)
                    found=1;
            }
        }
        if(!found){
            error("include file '%s' not found", buf1);
            f = NULL;
        }
        /* push current file in stack */
        /* XXX: fix current line init */
        include_stack_ptr->file = file;
        include_stack_ptr->filename = filename;
        include_stack_ptr->line_num = line_num;
        include_stack_ptr++;
        file = f;
        filename = strdup(buf1);
        line_num = 1;
    }
    if (tok == TOK_ERROR) {
        error("#error");
    }
    /* ignore other preprocess commands or #! for C scripts */
    while (ch != '\n' && ch != -1)
        cinp();
}

/* read a number in base b */
int getn(b)
{
    int n, t;
    n = 0;
    while (1) {
        if (ch >= 'a' & ch <= 'f')
            t = ch - 'a' + 10;
        else if (ch >= 'A' & ch <= 'F')
            t = ch - 'A' + 10;
        else if (isnum(ch))
            t = ch - '0';
        else
            break;
        if (t < 0 | t >= b)
            break;
        n = n * b + t;
        cinp();
    }
    return n;
}

/* read a character for string or char constant and eval escape codes */
int getq()
{
    int c;

    c = ch;
    minp();
    if (c == '\\') {
        if (isnum(ch)) {
            /* at most three octal digits */
            c = ch - '0';
            minp();
            if (isnum(ch)) {
                c = c * 8 + ch - '0';
                minp();
                if (isnum(ch)) {
                    c = c * 8 + ch - '0';
                    minp();
                }
            }
            return c;
        } else if (ch == 'x') {
            minp();
            return getn(16);
        } else {
            if (ch == 'a')
                c = '\a';
            else if (ch == 'b')
                c = '\b';
            else if (ch == 'f')
                c = '\f';
            else if (ch == 'n')
                c = '\n';
            else if (ch == 'r')
                c = '\r';
            else if (ch == 't')
                c = '\t';
            else if (ch == 'v')
                c = '\v';
            else if (ch == 'e' && gnu_ext)
                c = 27;
            else if (ch == '\'' || ch == '\"' || ch == '\\' || ch == '?')
                c = ch;
            else
                error("invalid escaped char");
            minp();
        }
    }
    return c;
}

void parse_number(void)
{
    int b, t, shift, frac_bits, s, exp_val;
    char *q;
    unsigned int n, n1;

    /* number */
    q = token_buf;
    t = ch;
    cinp();
    *q++ = t;
    b = 10;
    if (t == '.') {
        /* special dot handling */
        if (ch == '.') {
            cinp();
            if (ch != '.')
                expect("'.'");
            cinp();
            tok = TOK_DOTS;
        } else {
            /* dots */
            tok = t;
        }
        return;
    } else if (t == '0') {
        if (ch == 'x' || ch == 'X') {
            q--;
            cinp();
            b = 16;
        } else if (tcc_ext && (ch == 'b' || ch == 'B')) {
            q--;
            cinp();
            b = 2;
        }
    }
    /* parse all digits. cannot check octal numbers at this stage
       because of floating point constants */
    while (1) {
        if (ch >= 'a' & ch <= 'f')
            t = ch - 'a' + 10;
        else if (ch >= 'A' & ch <= 'F')
            t = ch - 'A' + 10;
        else if (isnum(ch))
            t = ch - '0';
        else
            break;
        if (t >= b)
            break;
        if (q >= token_buf + STRING_MAX_SIZE) {
            error("number too long");
        }
        *q++ = ch;
        cinp();
    }
    /* integer number */
    *q = '\0';
    q = token_buf;
    if (b == 10 && *q == '0') {
        b = 8;
        q++;
    }
    n = 0;
    while(1) {
        t = *q++;
        /* no need for checks except for base 10 / 8 errors */
        if (t == '\0') {
            break;
        } else if (t >= 'a') {
            t = t - 'a' + 10;
        } else if (t >= 'A') {
            t = t - 'A' + 10;
        } else {
            t = t - '0';
            if (t >= b)
                error("invalid digit");
        }
        n1 = n;
        n = n * b + t;
        /* detect overflow */
        if (n < n1)
            error("integer constant overflow");
    }
    tokc.ui = n;
    tok = TOK_NUM;
    /* XXX: add unsigned constant support (ANSI) */
    while (ch == 'L' || ch == 'l' || ch == 'U' || ch == 'u')
        cinp();
}


/* return next token without macro substitution */
void next_nomacro1(void)
{
    int b;
    char *q;
    TokenSym *ts;

    /* skip spaces */
    while(1) {
        while (ch == '\n') {
            cinp();
            while (ch == ' ' || ch == 9)
                cinp();
            if (ch == '#') {
                /* preprocessor command if # at start of line after
                   spaces */
                preprocess();
            }
        }
        if (ch != ' ' && ch != '\t' && ch != '\f')
            break;
        cinp();
    }
    if (isid(ch)) {
        q = token_buf;
        *q++ = ch;
        cinp();
        while (isid(ch) || isnum(ch)) {
            if (q >= token_buf + STRING_MAX_SIZE)
                error("ident too long");
            *q++ = ch;
            cinp();
        }
        *q = '\0';
        ts = tok_alloc(token_buf, q - token_buf);
        tok = ts->tok;
    } else if (isnum(ch) || ch == '.') {
        parse_number();
    } else if (ch == '\'') {
        tok = TOK_CCHAR;
        minp();
        tokc.i = getq();
        if (ch != '\'')
            expect("\'");
        minp();
    } else if (ch == '\"') {
        tok = TOK_STR;
        minp();
        q = token_buf;
        while (ch != '\"') {
            b = getq();
            if (ch == -1)
                error("unterminated string");
            if (q >= token_buf + STRING_MAX_SIZE)
                error("string too long");
            *q++ = b;
        }
        *q = '\0';
        tokc.ts = tok_alloc(token_buf, q - token_buf);
        minp();
    } else {
        q = "<=\236>=\235!=\225&&\240||\241++\244--\242==\224<<\1>>\2+=\253-=\255*=\252/=\257%=\245&=\246^=\336|=\374->\247..\250##\266";
        /* two chars */
        tok = ch;
        cinp();
        while (*q) {
            if (*q == tok && q[1] == ch) {
                cinp();
                tok = q[2] & 0xff;
                /* three chars tests */
                if (tok == TOK_SHL | tok == TOK_SAR) {
                    if (ch == '=') {
                        tok = tok | 0x80;
                        cinp();
                    }
                } else if (tok == TOK_DOTS) {
                    if (ch != '.')
                        error("parse error");
                    cinp();
                }
                return;
            }
            q = q + 3;
        }
        /* single char substitutions */
        if (tok == '<')
            tok = TOK_LT;
        else if (tok == '>')
            tok = TOK_GT;
    }
}

/* return next token without macro substitution. Can read input from
   macro_ptr buffer */
void next_nomacro()
{
    if (macro_ptr) {
        tok = *macro_ptr;
        if (tok)
            tok = tok_get(&macro_ptr, &tokc);
    } else {
        next_nomacro1();
    }
}

/* substitute args in macro_str and return allocated string */
int *macro_arg_subst(Sym **nested_list, int *macro_str, Sym *args)
{
    int *st, last_tok, t, notfirst, *str, len;
    Sym *s;
    TokenSym *ts;
    CValue cval;

    str = NULL;
    len = 0;
    last_tok = 0;
    while(1) {
        t = tok_get(&macro_str, &cval);
        if (!t)
            break;
        if (t == '#') {
            /* stringize */
            t = tok_get(&macro_str, &cval);
            if (!t)
                break;
            s = sym_find2(args, t);
            if (s) {
                token_buf[0] = '\0';
                st = (int *)s->c;
                /* XXX: buffer overflow */
                notfirst = 0;
                while (*st) {
                    if (notfirst)
                        strcat(token_buf, " ");
                    t = tok_get(&st, &cval);
                    strcat(token_buf, get_tok_str(t, &cval));
                    notfirst = 1;
                }
                /* add string */
                ts = tok_alloc(token_buf, 0);
                cval.ts = ts;
                tok_add2(&str, &len, TOK_STR, &cval);
            } else {
                tok_add2(&str, &len, t, &cval);
            }
        } else if (t >= TOK_IDENT) {
            s = sym_find2(args, t);
            if (s) {
                st = (int *)s->c;
                /* if '##' is present before or after , no arg substitution */
                if (*macro_str == TOK_TWOSHARPS || last_tok == TOK_TWOSHARPS) {
                    while (*st)
                        tok_add(&str, &len, *st++);
                } else {
                    macro_subst(&str, &len, nested_list, st);
                }
            } else {
                tok_add(&str, &len, t);
            }
        } else {
            tok_add2(&str, &len, t, &cval);
        }
        last_tok = t;
    }
    tok_add(&str, &len, 0);
    return str;
}

/* handle the '##' operator LJW HACK DELETED CODE*/
int *macro_twosharps(int *macro_str)
{
    TokenSym *ts;
    int *macro_str1, macro_str1_len, *macro_ptr1;
    int t;
    char *p;
    CValue cval;

    macro_str1 = NULL;
    macro_str1_len = 0;
    tok = 0;
    while (1) {
        next_nomacro();
        if (tok == 0)
            break;
        tok_add2(&macro_str1, &macro_str1_len, tok, &tokc);
    }
    tok_add(&macro_str1, &macro_str1_len, 0);
    return macro_str1;
}



/* do macro substitution of macro_str and add result to
   (tok_str,tok_len). If macro_str is NULL, then input stream token is
   substituted. 'nested_list' is the list of all macros we got inside
   to avoid recursing. */
void macro_subst(int **tok_str, int *tok_len, 
                 Sym **nested_list, int *macro_str)
{
    Sym *s, *args, *sa, *sa1;
    int *str, parlevel, len, *mstr, t, *saved_macro_ptr;
    int mstr_allocated, *macro_str1;
    int no_subst;
    CValue cval;

    saved_macro_ptr = macro_ptr;
    macro_ptr = macro_str;
    macro_str1 = NULL;
    if (macro_str) {
        /* first scan for '##' operator handling */
        macro_str1 = macro_twosharps(macro_str);
        macro_ptr = macro_str1;
    }

    while (1) {
        no_subst=0;
        next_nomacro();
        if (tok == 0)
            break;
        if ((s = sym_find1(&define_stack, tok)) != NULL) {
            /* if symbol is a macro, prepare substitution */
            /* if nested substitution, do nothing */
            if (sym_find2(*nested_list, tok))
                no_subst=1;
            if(no_subst==0){
                mstr = (int *)s->c;
                mstr_allocated = 0;
                sym_push2(nested_list, s->v, 0, 0);
                macro_subst(tok_str, tok_len, nested_list, mstr);
                /* pop nested defined symbol */
                sa1 = *nested_list;
                *nested_list = sa1->prev;
                free(sa1);
                if (mstr_allocated)
                free(mstr);
            }
        } else {
            no_subst=1;
        }
        if (no_subst) {
            /* no need to add if reading input stream */
            if (!macro_str)
                return;
            tok_add2(tok_str, tok_len, tok, &tokc);
        }
        /* only replace one macro while parsing input stream */
        if (!macro_str)
            return;
    }
    macro_ptr = saved_macro_ptr;
    if (macro_str1)
        free(macro_str1);
}

/* return next token with macro substitution */
void next(void)
{
    int len, *ptr;
    int redo=1;
    Sym *nested_list;

    /* special 'ungettok' case for label parsing */
    if (tok1) {
        tok = tok1;
        tokc = tok1c;
        tok1 = 0;
    } else {
    while(redo){
        redo=0;
        if (!macro_ptr) {
            /* if not reading from macro substuted string, then try to substitute */
            len = 0;
            ptr = NULL;
            nested_list = NULL;
            macro_subst(&ptr, &len, &nested_list, NULL);
            if (ptr) {
                tok_add(&ptr, &len, 0);
                macro_ptr = ptr;
                macro_ptr_allocated = ptr;
                redo=1;
                continue;
            }
            if (tok == 0) {
                redo=1;
                continue;
             }
        } else {
            next_nomacro();
            if (tok == 0) {
                /* end of macro string: free it */
                free(macro_ptr_allocated);
                macro_ptr = NULL;
                redo=1;
                continue;
            }
        }
        break;
    }
    }
}

void swap(int *p, int *q)
{
    int t;
    t = *p;
    *p = *q;
    *q = t;
}

void vsetc(int t, CValue *vc)
{
    if (vtop >= vstack + VSTACK_SIZE)
        error("memory full");
    /* cannot let cpu flags if other instruction are generated */
    /* XXX: VT_JMP test too ? */
    if ((vtop->t & VT_VALMASK) == VT_CMP)
        gv();
    vtop++;
    vtop->t = t;
    vtop->c = *vc;
}

void vset(int t, int v)
{
    CValue cval;

    cval.i = v;
    vsetc(t, &cval);
}

void vswap(void)
{
    SValue tmp;

    tmp = vtop[0];
    vtop[0] = vtop[-1];
    vtop[-1] = tmp;
}

void vdup(void)
{
    if (vtop >= vstack + VSTACK_SIZE)
        error("memory full");
    vtop++;
    *vtop = vtop[-1];
}

int save_reg_forced(int r)
{
    int i, l, t;
    SValue *p;

    /* store register */
    loc = (loc - 4) & -3;
    store(r, VT_LOCAL, loc);
    l = loc;

    /* modify all stack values */
    for(p=vstack;p<=vtop;p++) {
        i = p->t & VT_VALMASK;
        if (i == r) {
            if (p->t & VT_LVAL)
                t = VT_LLOCAL;
            else
                t = VT_LOCAL;
            p->t = (p->t & VT_TYPE) | VT_LVAL | t;
            p->c.ul = l;
        }
    }
    return l;
}

/* save r to memory. and mark it as being free */
void save_reg(int r)
{
    int i;
    SValue *p;

    /* modify all stack values */
    for(p=vstack;p<=vtop;p++) {
        i = p->t & VT_VALMASK;
        if (i == r) {
            save_reg_forced(r);
            break;
        }
    }
}

/* find a free register of class 'rc'. If none, save one register */
int get_reg(int rc)
{
    int r, i;
    int notfound;
    SValue *p;

    /* find a free register */
    for(r=0;r<NB_REGS;r++) {
        notfound=0;
        if (reg_classes[r] & rc) {
            for(p=vstack;p<=vtop;p++) {
                i = p->t & VT_VALMASK;
                if (i == r)
                    notfound=1;
            }
            if(!notfound){
            return r;
            }
        }
    }
    
    /* no register left : free the first one on the stack (very
       important to start from the bottom to ensure that we don't
       spill registers used in gen_op()) */
    for(p=vstack;p<=vtop;p++) {
        r = p->t & VT_VALMASK;
        if (r < VT_CONST && (reg_classes[r] & rc)) {
            save_reg(r);
            break;
        }
    }
    return r;
}

void save_regs()
{
    int r;
    SValue *p;

    for(p=vstack;p<=vtop;p++) {
        r = p->t & VT_VALMASK;
        if (r < VT_CONST) {
            save_reg(r);
        }
    }
}

/* move register 's' to 'r', and flush previous value of r to memory
   if needed */
void move_reg(int r, int s)
{
    if (r != s) {
        save_reg(r);
        load(r, s, 0);
    }
}

/* convert a (vtop->t, vtop->c) in register. lvalues are converted as
   values. Cannot be used if cannot be converted to register value
   (such as structures). */
int gv(void)
{
    int r, bit_pos, bit_size, rc, size, align, i;

    /* NOTE: get_reg can modify vstack[] */
    r = vtop->t & VT_VALMASK;
    if (r >= VT_CONST || (vtop->t & VT_LVAL)) {
        rc = REG_CLASS_INT;
        r = get_reg(rc);
    }
    load(r, vtop->t, vtop->c.ul);
    vtop->t = (vtop->t & VT_TYPE) | r;
    return r;
}

/* handle constant optimizations and various machine independant opt */
void gen_opc(int op)
{
    int fc, c1, c2, n;
    int general_case=0;
    SValue *v1, *v2;

    v1 = vtop - 1;
    v2 = vtop;
    /* currently, we cannot do computations with forward symbols */
    c1 = (v1->t & (VT_VALMASK | VT_LVAL | VT_FORWARD)) == VT_CONST;
    c2 = (v2->t & (VT_VALMASK | VT_LVAL | VT_FORWARD)) == VT_CONST;
    while(1) {
    if (c1 && c2) {
        fc = v2->c.i;
        switch(op) {
        case '+': v1->c.i += fc; break;
        case '-': v1->c.i -= fc; break;
        case '&': v1->c.i &= fc; break;
        case '^': v1->c.i ^= fc; break;
        case '|': v1->c.i |= fc; break;
        case '*': v1->c.i *= fc; break;
        case TOK_PDIV:
        case '/': v1->c.i /= fc; break; /* XXX: zero case ? */
        case '%': v1->c.i %= fc; break; /* XXX: zero case ? */
        case TOK_UDIV: v1->c.i = (unsigned)v1->c.i / fc; break; /* XXX: zero case ? */
        case TOK_UMOD: v1->c.i = (unsigned)v1->c.i % fc; break; /* XXX: zero case ? */
        case TOK_SHL: v1->c.i <<= fc; break;
        case TOK_SHR: v1->c.i = (unsigned)v1->c.i >> fc; break;
        case TOK_SAR: v1->c.i >>= fc; break;
            /* tests */
        case TOK_ULT: v1->c.i = (unsigned)v1->c.i < (unsigned)fc; break;
        case TOK_UGE: v1->c.i = (unsigned)v1->c.i >= (unsigned)fc; break;
        case TOK_EQ: v1->c.i = v1->c.i == fc; break;
        case TOK_NE: v1->c.i = v1->c.i != fc; break;
        case TOK_ULE: v1->c.i = (unsigned)v1->c.i <= (unsigned)fc; break;
        case TOK_UGT: v1->c.i = (unsigned)v1->c.i > (unsigned)fc; break;
        case TOK_LT: v1->c.i = v1->c.i < fc; break;
        case TOK_GE: v1->c.i = v1->c.i >= fc; break;
        case TOK_LE: v1->c.i = v1->c.i <= fc; break;
        case TOK_GT: v1->c.i = v1->c.i > fc; break;
            /* logical */
        case TOK_LAND: v1->c.i = v1->c.i && fc; break;
        case TOK_LOR: v1->c.i = v1->c.i || fc; break;
        default:
            general_case=1;
        }
        if(general_case){break;}
        vtop--;
    } else {
        /* if commutative ops, put c2 as constant */
        if (c1 && (op == '+' || op == '&' || op == '^' || 
                   op == '|' || op == '*')) {
            vswap();
            swap(&c1, &c2);
        }
        fc = vtop->c.i;
        if (c2 && (((op == '*' || op == '/' || op == TOK_UDIV || 
                     op == TOK_PDIV) && 
                    fc == 1) ||
                   ((op == '+' || op == '-' || op == '|' || op == '^' || 
                     op == TOK_SHL || op == TOK_SHR || op == TOK_SAR) && 
                    fc == 0) ||
                   (op == '&' && 
                    fc == -1))) {
            /* nothing to do */
            vtop--;
        } else if (c2 && (op == '*' || op == TOK_PDIV || op == TOK_UDIV)) {
            /* try to use shifts instead of muls or divs */
            if (fc > 0 && (fc & (fc - 1)) == 0) {
                n = -1;
                while (fc) {
                    fc >>= 1;
                    n++;
                }
                vtop->c.i = n;
                if (op == '*')
                    op = TOK_SHL;
                else if (op == TOK_PDIV)
                    op = TOK_SAR;
                else
                    op = TOK_SHR;
            }
            general_case=1;break;
        } else {
        general_case=1;
        }
    }
    break;
    }
    if(general_case){
        /* call low level op generator */
        /* XXX: remove explicit registers */
        gen_opi(op);
    }
}

int pointed_size(int t)
{
    return type_size(pointed_type(t), &t);
}

/* generic gen_op: handles types problems */
void gen_op(int op)
{
    int u, t1, t2, bt1, bt2, t;

    t1 = vtop[-1].t;
    t2 = vtop[0].t;
    bt1 = t1 & VT_BTYPE;
    bt2 = t2 & VT_BTYPE;
        
    if (op == '+' || op == '-') {
        if ((t1 & VT_BTYPE) == VT_PTR && 
            (t2 & VT_BTYPE) == VT_PTR) {
            if (op != '-')
                error("invalid type");
            /* XXX: check that types are compatible */
            u = pointed_size(t1);
            gen_opc(op);
            /* set to integer type */
            vtop->t = (vtop->t & ~VT_TYPE) | VT_INT; 
            vset(VT_CONST, u);
            gen_op(TOK_PDIV);
        } else if ((t1 & VT_BTYPE) == VT_PTR ||
                   (t2 & VT_BTYPE) == VT_PTR) {
            if ((t2 & VT_BTYPE) == VT_PTR) {
                vswap();
                swap(&t1, &t2);
            }
            /* stack-4 contains pointer, stack-2 value to add */
            vset(VT_CONST, pointed_size(vtop[-1].t));
            gen_op('*');
            gen_opc(op);
            /* put again type if gen_opc() swaped operands */
            vtop->t = (vtop->t & ~VT_TYPE) | (t1 & VT_TYPE);
        } else {
            gen_opc(op);
        }
    } else {
        /* XXX: test types and compute returned value */
        if ((t1 | t2) & VT_UNSIGNED ||
            (t1 & VT_BTYPE) == VT_PTR ||
            (t2 & VT_BTYPE) == VT_PTR) {
            if (op == TOK_SAR)
                op = TOK_SHR;
            else if (op == '/')
                op = TOK_UDIV;
            else if (op == '%')
                op = TOK_UMOD;
            else if (op == TOK_LT)
                op = TOK_ULT;
            else if (op == TOK_GT)
                op = TOK_UGT;
            else if (op == TOK_LE)
                op = TOK_ULE;
            else if (op == TOK_GE)
                op = TOK_UGE;
        }
        gen_opc(op);
    }
}

/* cast 'vtop' to 't' type */
void gen_cast(int t)
{
    int r, bits, sbt, dbt, sf, df, c, st1, dt1;

    r = vtop->t & VT_VALMASK;
    if (!(t & VT_LVAL)) {
        /* if not lvalue, then we convert now */
        dbt = t & VT_BTYPE;
        sbt = vtop->t & VT_BTYPE;
        if (sbt != dbt) {
            c = (vtop->t & (VT_VALMASK | VT_LVAL | VT_FORWARD)) == VT_CONST;
            if (dbt == VT_BYTE || dbt == VT_SHORT) {
                if (dbt == VT_BYTE)
                    bits = 8;
                else
                    bits = 16;
                if (t & VT_UNSIGNED) {
                    vset(VT_CONST, (1 << bits) - 1);
                    gen_op('&');
                } else {
                    bits = 32 - bits;
                    vset(VT_CONST, bits);
                    gen_op(TOK_SHL);
                    vset(VT_CONST, bits);
                    gen_op(TOK_SAR);
                }
            }
        }
    }
    vtop->t = (vtop->t & ~VT_TYPE) | t;
}

/* return type size. Put alignment at 'a' */
int type_size(int t, int *a)
{
    Sym *s;
    int bt;

    bt = t & VT_BTYPE;
    if (bt == VT_STRUCT) {
        /* struct/union */
        s = sym_find(((unsigned)t >> VT_STRUCT_SHIFT) | SYM_STRUCT);
        *a = 4; /* XXX: cannot store it yet. Doing that is safe */
        return s->c;
    } else if (bt == VT_PTR) {
        if (t & VT_ARRAY) {
            s = sym_find(((unsigned)t >> VT_STRUCT_SHIFT));
            return type_size(s->t, a) * s->c;
        } else {
            *a = PTR_SIZE;
            return PTR_SIZE;
        }
    } else if (bt == VT_INT || bt == VT_ENUM ) {
        *a = 4;
        return 4;
    } else if (bt == VT_SHORT) {
        *a = 2;
        return 2;
    } else {
        /* char, void, function, _Bool */
        *a = 1;
        return 1;
    }
}

/* return the pointed type of t */
int pointed_type(int t)
{
    Sym *s;
    s = sym_find(((unsigned)t >> VT_STRUCT_SHIFT));
    return s->t | (t & ~VT_TYPE);
}

int mk_pointer(int t)
{
    int p;
    p = anon_sym++;
    sym_push(p, t, -1);
    return VT_PTR | (p << VT_STRUCT_SHIFT) | (t & ~VT_TYPE);
}

int is_compatible_types(int t1, int t2)
{
    Sym *s1, *s2;
    int bt1, bt2;

    t1 &= VT_TYPE;
    t2 &= VT_TYPE;
    bt1 = t1 & VT_BTYPE;
    bt2 = t2 & VT_BTYPE;
    if (bt1 == VT_PTR) {
        t1 = pointed_type(t1);
        /* if function, then convert implicitely to function pointer */
        if (bt2 != VT_FUNC) {
            if (bt2 != VT_PTR)
                return 0;
            t2 = pointed_type(t2);
        }
        /* void matches everything */
        t1 &= VT_TYPE;
        t2 &= VT_TYPE;
        if (t1 == VT_VOID || t2 == VT_VOID)
            return 1;
        return is_compatible_types(t1, t2);
    } else if (bt1 == VT_STRUCT) {
        return (t2 == t1);
    } else if (bt1 == VT_FUNC) {
        if (bt2 != VT_FUNC)
            return 0;
        s1 = sym_find(((unsigned)t1 >> VT_STRUCT_SHIFT));
        s2 = sym_find(((unsigned)t2 >> VT_STRUCT_SHIFT));
        if (!is_compatible_types(s1->t, s2->t))
            return 0;
        /* XXX: not complete */
        if (s1->c == FUNC_OLD || s2->c == FUNC_OLD)
            return 1;
        if (s1->c != s2->c)
            return 0;
        while (s1 != NULL) {
            if (s2 == NULL)
                return 0;
            if (!is_compatible_types(s1->t, s2->t))
                return 0;
            s1 = s1->next;
            s2 = s2->next;
        }
        if (s2)
            return 0;
        return 1;
    } else {
        /* XXX: not complete */
        return 1;
    }
}

int check_assign_types(int t1, int t2)
{
    t1 &= VT_TYPE;
    t2 &= VT_TYPE;
    if ((t1 & VT_BTYPE) == VT_PTR && 
        (t2 & VT_BTYPE) == VT_FUNC) {
        return is_compatible_types(pointed_type(t1), t2);
    } else {
        return is_compatible_types(t1, t2);
    }
}

/* print a type. If 'varstr' is not NULL, then the variable is also
   printed in the type */
/* XXX: add array and function pointers */
/* XXX: buffer overflows */
void type_to_str(char *buf, int buf_size, 
                 int t, const char *varstr)
{
    int bt, v;
    Sym *s, *sa;
    char buf1[256];

    t = t & VT_TYPE;
    bt = t & VT_BTYPE;
    buf[0] = '\0';
    if (t & VT_UNSIGNED)
        strcat(buf, "unsigned ");
    switch(bt) {
    case VT_VOID:
        strcat(buf, "void");
        break;
    case VT_BYTE:
        strcat(buf, "char");
        break;
    case VT_SHORT:
        strcat(buf, "short");
        break;
    case VT_INT:
        strcat(buf, "int");
        break;
    case VT_ENUM:
    case VT_STRUCT:
        if (bt == VT_STRUCT)
            strcat(buf, "struct ");
        else
            strcat(buf, "enum ");
        v = (unsigned)t >> VT_STRUCT_SHIFT;
        if (v >= SYM_FIRST_ANOM)
            strcat(buf, "<anonymous>");
        else
            strcat(buf, get_tok_str(v, NULL));
        break;
    case VT_FUNC:
        s = sym_find((unsigned)t >> VT_STRUCT_SHIFT);
        type_to_str(buf, buf_size, s->t, varstr);
        strcat(buf, "(");
        sa = s->next;
        while (sa != NULL) {
            type_to_str(buf1, sizeof(buf1), sa->t, NULL);
            strcat(buf, buf1);
            sa = sa->next;
            if (sa)
                strcat(buf, ", ");
        }
        strcat(buf, ")");
        return;
    case VT_PTR:
        s = sym_find((unsigned)t >> VT_STRUCT_SHIFT);
        strcpy(buf1, "*");
        if (varstr)
            strcat(buf1, varstr);
        type_to_str(buf, buf_size, s->t, buf1);
        return;
    }
    if (varstr) {
        strcat(buf, " ");
        strcat(buf, varstr);
    }
}

                 

/* verify type compatibility to store vtop in 'st' type, and generate
   casts if needed */
void gen_assign_cast(int dt)
{
    int st;
    char buf1[256], buf2[256];

    st = vtop->t; /* destination type */
    if (!check_assign_types(dt, st)) {
        type_to_str(buf1, sizeof(buf1), st, NULL);
        type_to_str(buf2, sizeof(buf2), dt, NULL);
        error("cannot cast '%s' to '%s'", buf1, buf2);
    }
}


/* store vtop in lvalue pushed on stack */
void vstore(void)
{
    int ft, fc, r, t, size, align, bit_size, bit_pos;
    GFuncContext gf;

    ft = vtop[-1].t;
    gen_assign_cast(ft & VT_TYPE);

    if ((vtop->t & VT_BTYPE) == VT_STRUCT) {
        /* if structure, only generate pointer */
        /* structure assignment : generate memcpy */
        /* XXX: optimize if small size */

        vdup();
        gfunc_start(&gf);
        /* type size */
        size = type_size(vtop->t, &align);
        vset(VT_CONST, size);
        gfunc_param(&gf);
        /* source */
        vtop->t &= ~VT_LVAL;
        gfunc_param(&gf);
        /* destination */
        vswap();
        vtop->t &= ~VT_LVAL;
        gfunc_param(&gf);

        save_regs();
        vset(VT_CONST, (int)&memcpy);
if(reloc){
special=1;
  printf("memcpy function pointer stuff\n");
}
        gfunc_call(&gf);
if(reloc){
special=0;
}
        /* leave source on stack */
    } else {
        r = gv();  /* generate value */
        ft = vtop[-1].t;
        fc = vtop[-1].c.i;
        /* if lvalue was saved on stack, must read it */
        if ((ft & VT_VALMASK) == VT_LLOCAL) {
            t = get_reg(REG_CLASS_INT);
            load(t, VT_LOCAL | VT_LVAL, fc);
            ft = (ft & ~VT_VALMASK) | t;
        }
        store(r, ft, fc);
        vtop--;
        vtop->t = (ft & VT_TYPE) | r;
        vtop->c.i = 0;
    }
}

/* post defines POST/PRE add. c is the token ++ or -- */
void inc(int post, int c)
{
    int r, r1;

    test_lvalue();
    if (post)
        vdup(); /* room for returned value */
    vdup(); /* save lvalue */
    r = gv();
    if (post) {
        /* duplicate value */
        /* XXX: handle floats */
        r1 = get_reg(REG_CLASS_INT);
        load(r1, r, 0); /* move r to r1 */
        /* duplicates value */
        vtop[-2].t = (vtop->t & VT_TYPE) | r1;
        vtop[-2].c.i = 0;
    }
    /* add constant */
    vset(VT_CONST, c - TOK_MID); 
    gen_op('+');
    vstore(); /* store value */
    if (post)
        vpop(); /* if post op, return saved value */
}

/* enum/struct/union declaration */
int struct_decl(int u)
{
    int a, t, b, v, size, align, maxalign, c, offset;
    int bit_size, bit_pos, bsize, bt, lbit_pos;
    Sym *s, *ss, **ps;

    a = tok; /* save decl type */
    next();
    while(1){
    if (tok != '{') {
        v = tok;
        next();
        /* struct already defined ? return it */
        /* XXX: check consistency */
        if (s = sym_find(v | SYM_STRUCT)) {
            if (s->t != a)
                error("invalid type");
            break;
        }
    } else {
        v = anon_sym++;
    }
    s = sym_push(v | SYM_STRUCT, a, 0);
    /* put struct/union/enum name in type */
    break;
    }
    u = u | (v << VT_STRUCT_SHIFT);
    
    if (tok == '{') {
        next();
        if (s->c)
            error("struct/union/enum already defined");
        /* cannot be empty */
        c = 0;
        maxalign = 0;
        ps = &s->next;
        bit_pos = 0;
        offset = 0;
        while (1) {
            if (a == TOK_ENUM) {
                v = tok;
                next();
                if (tok == '=') {
                    next();
                    c = expr_const();
                }
                /* enum symbols have static storage */
                sym_push(v, VT_CONST | VT_STATIC, c);
                if (tok == ',')
                    next();
                c++;
            } else {
                b = ist();
                while (1) {
                    bit_size = -1;
                    v = 0;
                    if (tok != ':') {
                        t = type_decl(&v, b, TYPE_DIRECT);
                        if ((t & VT_BTYPE) == VT_FUNC ||
                            (t & (VT_TYPEDEF | VT_STATIC | VT_EXTERN)))
                            error("invalid type for '%s'", 
                                  get_tok_str(v, NULL));
                    }
                    size = type_size(t, &align);
                    lbit_pos = 0;
                    bit_pos = 0;
                    if (v) {
                        /* add new memory data only if starting
                           bit field */
                        if (lbit_pos == 0) {
                            if (a == TOK_STRUCT) {
                                c = (c + align - 1) & -align;
                                offset = c;
                                c += size;
                            } else {
                                offset = 0;
                                if (size > c)
                                    c = size;
                            }
                            if (align > maxalign)
                                maxalign = align;
                        }
                        ss = sym_push(v | SYM_FIELD, t, offset);
                        *ps = ss;
                        ps = &ss->next;
                    }
                    if (tok == ';' || tok == -1)
                        break;
                    skip(',');
                }
                skip(';');
            }
            if (tok == '}')
                break;
        }
        skip('}');
        /* size for struct/union, dummy for enum */
        s->c = (c + maxalign - 1) & -maxalign; 
    }
    return u;
}

int basic_type1(int t,int u){
    if ((t & VT_BTYPE) != 0)
        error("too many basic types %x", t);
    t |= u;
    return t;
}

int basic_type(int t, int u){
    next();
    return basic_type1(t,u);
}


/* return 0 if no type declaration. otherwise, return the basic type
   and skip it. 
   XXX: A '2' is ored to ensure non zero return if int type.
 */
int ist(void)
{
    int t, u;
    Sym *s;

    t = 0;
    while(1) {
        switch(tok) {
            /* basic types */
        case TOK_CHAR:
            u = VT_BYTE;
            t=basic_type(t,u);
            break;
        case TOK_VOID:
            u = VT_VOID;
            t=basic_type(t,u);
            break;
        case TOK_SHORT:
            u = VT_SHORT;
            t=basic_type(t,u);
            break;
        case TOK_INT:
            next();
            break;
        case TOK_ENUM:
            u = struct_decl(VT_ENUM);
            t=basic_type1(t,u);
            break;
        case TOK_STRUCT:
        case TOK_UNION:
            u = struct_decl(VT_STRUCT);
            t=basic_type1(t,u);
            break;

            /* type modifiers */
        case TOK_CONST:
        case TOK_VOLATILE:
        case TOK_REGISTER:
        case TOK_SIGNED:
        case TOK_AUTO:
        case TOK_INLINE:
        case TOK_RESTRICT:
            next();
            break;
        case TOK_UNSIGNED:
            t |= VT_UNSIGNED;
            next();
            break;

            /* storage */
        case TOK_EXTERN:
            t |= VT_EXTERN;
            next();
            break;
        case TOK_STATIC:
            t |= VT_STATIC;
            next();
            break;
        case TOK_TYPEDEF:
            t |= VT_TYPEDEF;
            next();
            break;
        default:
            s = sym_find(tok);
            if (!s || !(s->t & VT_TYPEDEF))
                return t;
            t |= (s->t & ~VT_TYPEDEF);
            next();
            break;
        }
        t |= 2;
    }
    return t;
}

int post_type(int t)
{
    int p, n, pt, l, t1;
    int foo;
    Sym **plast, *s, *first;

    if (tok == '(') {
        /* function declaration */
        next();
        l = 0;
        first = NULL;
        plast = &first;
        while (tok != ')') {
            foo=0;
            /* read param name and compute offset */
            while(1){
            if (l != FUNC_OLD) {
                if (!(pt = ist())) {
                    if (l) {
                        error("invalid type");
                    } else {
                        l = FUNC_OLD;
                        n = tok;
                        pt = VT_INT;
                        next();
                        break;
                    }
                }
                l = FUNC_NEW;
                if ((pt & VT_BTYPE) == VT_VOID && tok == ')') {
                    foo=1;
                    break;
                }
                pt = type_decl(&n, pt, TYPE_DIRECT | TYPE_ABSTRACT);
                if ((pt & VT_BTYPE) == VT_VOID)
                    error("parameter declared as void");
            } else {
                n = tok;
                pt = VT_INT;
                next();
            }
            break;
            }
            if(foo){break;}
            /* array must be transformed to pointer according to ANSI C */
            pt &= ~VT_ARRAY;
            s = sym_push(n | SYM_FIELD, pt, 0);
            *plast = s;
            plast = &s->next;
            if (tok == ',') {
                next();
                if (l == FUNC_NEW && tok == TOK_DOTS) {
                    l = FUNC_ELLIPSIS;
                    next();
                    break;
                }
            }
        }
        /* if no parameters, then old type prototype */
        if (l == 0)
            l = FUNC_OLD;
        skip(')');
        t1 = t & (VT_TYPEDEF | VT_STATIC | VT_EXTERN);
        t = post_type(t & ~(VT_TYPEDEF | VT_STATIC | VT_EXTERN));
        /* we push a anonymous symbol which will contain the function prototype */
        p = anon_sym++;
        s = sym_push(p, t, l);
        s->next = first;
        t = t1 | VT_FUNC | (p << VT_STRUCT_SHIFT);
    } else if (tok == '[') {
        /* array definition */
        next();
        n = -1;
        if (tok != ']') {
            n = expr_const();
            if (n < 0)
                error("invalid array size");    
        }
        skip(']');
        /* parse next post type */
        t1 = t & (VT_TYPEDEF | VT_STATIC | VT_EXTERN);
        t = post_type(t & ~(VT_TYPEDEF | VT_STATIC | VT_EXTERN));
        
        /* we push a anonymous symbol which will contain the array
           element type */
        p = anon_sym++;
        sym_push(p, t, n);
        t = t1 | VT_ARRAY | VT_PTR | (p << VT_STRUCT_SHIFT);
    }
    return t;
}

/* Read a type declaration (except basic type), and return the
   type. If v is true, then also put variable name in 'vtop->c' */
int type_decl(int *v, int t, int td)
{
    int u, p;
    Sym *s;

    t = t & -3; /* suppress the ored '2' */
    while (tok == '*') {
        next();
        while (tok == TOK_CONST || tok == TOK_VOLATILE || tok == TOK_RESTRICT)
            next();
        t = mk_pointer(t);
    }
    
    /* recursive type */
    /* XXX: incorrect if abstract type for functions (e.g. 'int ()') */
    if (tok == '(') {
        next();
        u = type_decl(v, 0, td);
        skip(')');
    } else {
        u = 0;
        /* type identifier */
        if (tok >= TOK_IDENT && (td & TYPE_DIRECT)) {
            *v = tok;
            next();
        } else {
            if (!(td & TYPE_ABSTRACT))
                expect("identifier");
            *v = 0;
        }
    }
    /* append t at the end of u */
    t = post_type(t);
    if (!u) 
        return t;
    p = u;
    while(1) {
        s = sym_find((unsigned)p >> VT_STRUCT_SHIFT);
        p = s->t;
        if (!p) {
            s->t = t;
            break;
        }
    }
    return u;
}

/* define a new external reference to a function 'v' of type 'u' */
Sym *external_sym(int v, int u)
{
    Sym *s;
    s = sym_find(v);
    if (!s) {
        /* push forward reference */
        s = sym_push1(&global_stack, 
                      v, u | VT_CONST | VT_FORWARD, 0);
    }
    return s;
}

void indir(void)
{
    if (vtop->t & VT_LVAL)
        gv();
    if ((vtop->t & VT_BTYPE) != VT_PTR)
        expect("pointer");
    vtop->t = pointed_type(vtop->t);
    if (!(vtop->t & VT_ARRAY)) /* an array is never an lvalue */
        vtop->t |= VT_LVAL;
}

/* pass a parameter to a function and do type checking and casting */
void gfunc_param_typed(GFuncContext *gf, Sym *func, Sym *arg)
{
    int func_type;
    func_type = func->c;
    if (func_type == FUNC_OLD ||
        (func_type == FUNC_ELLIPSIS && arg == NULL)) {
        /* default casting : only need to convert float to double */
        if ((vtop->t & VT_BTYPE) == VT_FLOAT)
            gen_cast(VT_DOUBLE);
    } else if (arg == NULL) {
        error("too many arguments to function");
    } else {
        gen_assign_cast(arg->t);
    }
    gfunc_param(gf);
}

void unary(void)
{
    int n, t, ft, fc, p, align, size;
    Sym *s;
    GFuncContext gf;

    if (tok == TOK_NUM || tok == TOK_CCHAR || tok == TOK_LCHAR) {
        vset(VT_CONST | VT_INT, tokc.i);
        next();
    } else if (tok == TOK___FUNC__) {
        /* special function name identifier */
        /* generate (char *) type */
        vset(VT_CONST | mk_pointer(VT_BYTE), glo);
        strcpy((void *)glo, funcname);
        glo += strlen(funcname) + 1;
        next();
    } else if (tok == TOK_STR) {
        /* string parsing */
        t = VT_BYTE;
        type_size(t, &align);
        glo = (glo + align - 1) & -align;
        fc = glo;
        /* we must declare it as an array first to use initializer parser */
        t = VT_CONST | VT_ARRAY | mk_pointer(t);
        decl_initializer(t, glo, 1, 0);
        glo += type_size(t, &align);
        /* put it as pointer */
        vset(t & ~VT_ARRAY, fc);
    } else {
        t = tok;
        next();
        if (t == '(') {
            /* cast ? */
            if (t = ist()) {
                ft = type_decl(&n, t, TYPE_ABSTRACT);
                skip(')');
                /* check ISOC99 compound literal */
                if (tok == '{') {
                    /* data is allocated locally by default */
                    if (global_expr)
                        ft |= VT_CONST;
                    else
                        ft |= VT_LOCAL;
                    /* all except arrays are lvalues */
                    if (!(ft & VT_ARRAY))
                        ft |= VT_LVAL;
                    fc = decl_initializer_alloc(ft, 1);
                    vset(ft, fc);
                } else {
                    unary();
                    gen_cast(ft);
                }
            } else {
                gexpr();
                skip(')');
            }
        } else if (t == '*') {
            unary();
            indir();
        } else if (t == '&') {
            unary();
            /* functions names must be treated as function pointers,
               except for unary '&' and sizeof. Since we consider that
               functions are not lvalues, we only have to handle it
               there and in function calls. */
            if ((vtop->t & VT_BTYPE) != VT_FUNC)
                test_lvalue();
            vtop->t = mk_pointer(vtop->t & VT_LVALN);
        } else
        if (t == '!') {
            unary();
            if ((vtop->t & (VT_VALMASK | VT_LVAL)) == VT_CONST) 
                vtop->c.i = !vtop->c.i;
            else if ((vtop->t & VT_VALMASK) == VT_CMP)
                vtop->c.i = vtop->c.i ^ 1;
            else
                vset(VT_JMP, gtst(1, 0));
        } else
        if (t == '~') {
            unary();
            vset(VT_CONST, -1);
            gen_op('^');
        } else 
        if (t == '+') {
            unary();
        } else 
        if (t == TOK_SIZEOF) {
            if (tok == '(') {
                next();
                if (t = ist())
                    t = type_decl(&n, t, TYPE_ABSTRACT);
                else {
                    /* XXX: some code could be generated: add eval
                       flag */
                    gexpr();
                    t = vtop->t;
                    vpop();
                }
                skip(')');
            } else {
                unary();
                t = vtop->t;
                vpop();
            }
            vset(VT_CONST, type_size(t, &t));
        } else
        if (t == TOK_INC || t == TOK_DEC) {
            unary();
            inc(0, t);
        } else if (t == '-') {
            vset(VT_CONST, 0);
            unary();
            gen_op('-');
        } else 
        {
            s = sym_find(t);
            if (!s) {
                if (tok != '(')
                    error("'%s' undeclared", get_tok_str(t, NULL));
                /* for simple function calls, we tolerate undeclared
                   external reference */
                p = anon_sym++;        
                sym_push1(&global_stack, p, 0, FUNC_OLD);
                /* int() function */
                s = external_sym(t, VT_FUNC | (p << VT_STRUCT_SHIFT)); 
            }
            vset(s->t, s->c);
            /* if forward reference, we must point to s */
            if (vtop->t & VT_FORWARD)
                vtop->c.sym = s;
        }
    }
    
    /* post operations */
    while (1) {
        if (tok == TOK_INC | tok == TOK_DEC) {
            inc(1, tok);
            next();
        } else if (tok == '.' | tok == TOK_ARROW) {
            /* field */ 
            if (tok == TOK_ARROW) 
                indir();
            test_lvalue();
            vtop->t &= VT_LVALN;
            next();
            /* expect pointer on structure */
            if ((vtop->t & VT_BTYPE) != VT_STRUCT)
                expect("struct or union");
            s = sym_find(((unsigned)vtop->t >> VT_STRUCT_SHIFT) | SYM_STRUCT);
            /* find field */
            tok |= SYM_FIELD;
            while (s = s->next) {
                if (s->v == tok)
                    break;
            }
            if (!s)
                error("field not found");
            /* add field offset to pointer */
            vtop->t = (vtop->t & ~VT_TYPE) | VT_INT; /* change type to int */
            vset(VT_CONST, s->c);
            gen_op('+');
            /* change type to field type, and set to lvalue */
            vtop->t = (vtop->t & ~VT_TYPE) | s->t;
            /* an array is never an lvalue */
            if (!(vtop->t & VT_ARRAY))
                vtop->t |= VT_LVAL;
            next();
        } else if (tok == '[') {
            next();
            gexpr();
            gen_op('+');
            indir();
            skip(']');
        } else if (tok == '(') {
            int rett;
            CValue retc;
            Sym *sa;

            /* function call  */
            if ((vtop->t & VT_BTYPE) != VT_FUNC) {
                /* pointer test (no array accepted) */
                if ((vtop->t & (VT_BTYPE | VT_ARRAY)) == VT_PTR) {
                    vtop->t = pointed_type(vtop->t);
                    if ((vtop->t & VT_BTYPE) != VT_FUNC)
                        expect("function pointer");
                } else {
                    expect("function pointer");
                }
            } else {
                vtop->t &= ~VT_LVAL; /* no lvalue */
            }
            /* get return type */
            s = sym_find((unsigned)vtop->t >> VT_STRUCT_SHIFT);
            save_regs(); /* save used temporary registers */
            gfunc_start(&gf);
            next();
            sa = s->next; /* first parameter */
            {
                int *str, len, parlevel, *saved_macro_ptr;
                Sym *args, *s1;

                /* read each argument and store it on a stack */
                /* XXX: merge it with macro args ? */
                args = NULL;
                while (tok != ')') {
                    len = 0;
                    str = NULL;
                    parlevel = 0;
                    while ((parlevel > 0 || (tok != ')' && tok != ',')) && 
                           tok != -1) {
                        if (tok == '(')
                            parlevel++;
                        else if (tok == ')')
                            parlevel--;
                        tok_add2(&str, &len, tok, &tokc);
                        next();
                    }
                    tok_add(&str, &len, -1); /* end of file added */
                    tok_add(&str, &len, 0);
                    s1 = sym_push2(&args, 0, 0, (int)str);
                    s1->next = sa; /* add reference to argument */
                    if (sa)
                        sa = sa->next;
                    if (tok != ',')
                        break;
                    next();
                }
                if (tok != ')')
                    expect(")");
                
                /* now generate code in reverse order by reading the stack */
                saved_macro_ptr = macro_ptr;
                while (args) {
                    macro_ptr = (int *)args->c;
                    next();
                    expr_eq();
                    if (tok != -1)
                        expect("',' or ')'");
                    gfunc_param_typed(&gf, s, args->next);
                    s1 = args->prev;
                    free((int *)args->c);
                    free(args);
                    args = s1;
                }
                macro_ptr = saved_macro_ptr;
                /* restore token */
                tok = ')';
            }
            /* compute first implicit argument if a structure is returned */
            if ((s->t & VT_BTYPE) == VT_STRUCT) {
                /* get some space for the returned structure */
                size = type_size(s->t, &align);
                loc = (loc - size) & -align;
                rett = s->t | VT_LOCAL | VT_LVAL;
                /* pass it as 'int' to avoid structure arg passing
                   problems */
                vset(VT_INT | VT_LOCAL, loc);
                retc = vtop->c;
                gfunc_param(&gf);
            } else {
                rett = s->t | FUNC_RET_REG; /* return in register */
                retc.i = 0;
            }
            if (sa)
                error("too few arguments to function %x", sa->t);
            skip(')');
            gfunc_call(&gf);
            /* return value */
            vsetc(rett, &retc);
        } else {
            break;
        }
    }
}

void uneq(void)
{
    int t;
    
    unary();
    if (tok == '=' ||
        (tok >= TOK_A_MOD && tok <= TOK_A_DIV) ||
        tok == TOK_A_XOR || tok == TOK_A_OR ||
        tok == TOK_A_SHL || tok == TOK_A_SAR) {
        test_lvalue();
        t = tok;
        next();
        if (t == '=') {
            expr_eq();
        } else {
            vdup();
            expr_eq();
            gen_op(t & 0x7f);
        }
        vstore();
    }
}

void sum(int l)
{
    int t;

    if (l == 0)
        uneq();
    else {
        sum(--l);
        while ((l == 0 & (tok == '*' | tok == '/' | tok == '%')) |
               (l == 1 & (tok == '+' | tok == '-')) |
               (l == 2 & (tok == TOK_SHL | tok == TOK_SAR)) |
               (l == 3 & ((tok >= TOK_ULE & tok <= TOK_GT) |
                          tok == TOK_ULT | tok == TOK_UGE)) |
               (l == 4 & (tok == TOK_EQ | tok == TOK_NE)) |
               (l == 5 & tok == '&') |
               (l == 6 & tok == '^') |
               (l == 7 & tok == '|') |
               (l == 8 & tok == TOK_LAND) |
               (l == 9 & tok == TOK_LOR)) {
            t = tok;
            next();
            sum(l);
            gen_op(t);
       }
    }
}

/* only used if non constant */
void eand(void)
{
    int t;

    sum(8);
    t = 0;
    while (1) {
        if (tok != TOK_LAND) {
            if (t) {
                t = gtst(1, t);
                vset(VT_JMPI, t);
            }
            break;
        }
        t = gtst(1, t);
        next();
        sum(8);
    }
}

void eor(void)
{
    int t;

    eand();
    t = 0;
    while (1) {
        if (tok != TOK_LOR) {
            if (t) {
                t = gtst(0, t);
                vset(VT_JMP, t);
            }
            break;
        }
        t = gtst(0, t);
        next();
        eand();
    }
}

/* XXX: better constant handling */
void expr_eq(void)
{
    int t, u, c, r1, r2;

    if (const_wanted) {
        sum(10);
        if (tok == '?') {
            c = vtop->c.i;
            vpop();
            next();
            gexpr();
            t = vtop->c.i;
            vpop();
            skip(':');
            expr_eq();
            if (c)
                vtop->c.i = t;
        }
    } else {
        eor();
        if (tok == '?') {
            next();
            t = gtst(1, 0);

            gexpr();
            r1 = gv();
            vpop();
            skip(':');
            u = gjmp(0);

            gsym(t);
            expr_eq();
            r2 = gv();
            move_reg(r1, r2);
            vtop->t = (vtop->t & VT_TYPE) | r1;
            gsym(u);
        }
    }
}

void gexpr(void)
{
    while (1) {
        expr_eq();
        if (tok != ',')
            break;
        vpop();
        next();
    }
}

/* parse a constant expression and return value in vtop */
void expr_const1(void)
{
    int a;
    a = const_wanted;
    const_wanted = 1;
    expr_eq();
    if ((vtop->t & (VT_CONST | VT_LVAL)) != VT_CONST)
        expect("constant");
    const_wanted = a;
}

/* parse an integer constant and return its value */
int expr_const(void)
{
    int c;
    expr_const1();
    c = vtop->c.i;
    vpop();
    return c;
}

/* return the label token if current token is a label, otherwise
   return zero */
int is_label(void)
{
    int t;
    CValue c;

    /* fast test first */
    if (tok < TOK_UIDENT)
        return 0;
    /* no need to save tokc since we expect an identifier */
    t = tok;
    c = tokc;
    next();
    if (tok == ':') {
        next();
        return t;
    } else {
        /* XXX: may not work in all cases (macros ?) */
        tok1 = tok;
        tok1c = tokc;
        tok = t;
        tokc = c;
        return 0;
    }
}

void block(int *bsym, int *csym, int *case_sym, int *def_sym, int case_reg)
{
    int a, b, c, d;
    Sym *s;

    if (tok == TOK_IF) {
        /* if test */
        next();
        skip('(');
        gexpr();
        skip(')');
        a = gtst(1, 0);
        block(bsym, csym, case_sym, def_sym, case_reg);
        c = tok;
        if (c == TOK_ELSE) {
            next();
            d = gjmp(0);
            gsym(a);
            block(bsym, csym, case_sym, def_sym, case_reg);
            gsym(d); /* patch else jmp */
        } else
            gsym(a);
    } else if (tok == TOK_WHILE) {
        next();
        d = ind;
        skip('(');
        gexpr();
        skip(')');
        a = gtst(1, 0);
        b = 0;
        block(&a, &b, case_sym, def_sym, case_reg);
        oad(0xe9, d - ind - 5); /* jmp */
        gsym(a);
        gsym_addr(b, d);
    } else if (tok == '{') {
        next();
        /* declarations */
        s = local_stack.top;
        while (tok != '}') {
            decl(VT_LOCAL);
            if (tok != '}')
                block(bsym, csym, case_sym, def_sym, case_reg);
        }
        /* pop locally defined symbols */
        sym_pop(&local_stack, s);
        next();
    } else if (tok == TOK_RETURN) {
        next();
        if (tok != ';') {
            gexpr();
            if ((func_vt & VT_BTYPE) == VT_STRUCT) {
                /* if returning structure, must copy it to implicit
                   first pointer arg location */
                vset(mk_pointer(func_vt) | VT_LOCAL | VT_LVAL, func_vc);
                indir();
                vswap();
                /* copy structure value to pointer */
                vstore();
            } else {
                /* move return value to standard return register */
                move_reg(FUNC_RET_REG, gv());
            }
            vpop();
        }
        skip(';');
        rsym = gjmp(rsym); /* jmp */
    } else if (tok == TOK_BREAK) {
        /* compute jump */
        if (!bsym)
            error("cannot break");
        *bsym = gjmp(*bsym);
        next();
        skip(';');
    } else if (tok == TOK_CONTINUE) {
        /* compute jump */
        if (!csym)
            error("cannot continue");
        *csym = gjmp(*csym);
        next();
        skip(';');
    } else if (tok == TOK_FOR) {
        int e;
        next();
        skip('(');
        if (tok != ';') {
            gexpr();
            vpop();
        }
        skip(';');
        d = ind;
        c = ind;
        a = 0;
        b = 0;
        if (tok != ';') {
            gexpr();
            a = gtst(1, 0);
        }
        skip(';');
        if (tok != ')') {
            e = gjmp(0);
            c = ind;
            gexpr();
            vpop();
            oad(0xe9, d - ind - 5); /* jmp */
            gsym(e);
        }
        skip(')');
        block(&a, &b, case_sym, def_sym, case_reg);
        oad(0xe9, c - ind - 5); /* jmp */
        gsym(a);
        gsym_addr(b, c);
    } else 
    if (tok == TOK_DO) {
        next();
        a = 0;
        b = 0;
        d = ind;
        block(&a, &b, case_sym, def_sym, case_reg);
        skip(TOK_WHILE);
        skip('(');
        gsym(b);
        gexpr();
        c = gtst(0, 0);
        gsym_addr(c, d);
        skip(')');
        gsym(a);
        skip(';');
    } else
    if (tok == TOK_SWITCH) {
        next();
        skip('(');
        gexpr();
        case_reg = gv();
        vpop();
        skip(')');
        a = 0;
        b = gjmp(0); /* jump to first case */
        c = 0;
        block(&a, csym, &b, &c, case_reg);
        /* if no default, jmp after switch */
        if (c == 0)
            c = ind;
        /* default label */
        gsym_addr(b, c);
        /* break label */
        gsym(a);
    } else
    if (tok == TOK_CASE) {
        next();
        a = expr_const();
        if (!case_sym)
            expect("switch");
        /* since a case is like a label, we must skip it with a jmp */
        b = gjmp(0);
        gsym(*case_sym);
        vset(case_reg, 0);
        vset(VT_CONST, a);
        gen_op(TOK_EQ);
        *case_sym = gtst(1, 0);
        gsym(b);
        skip(':');
        block(bsym, csym, case_sym, def_sym, case_reg);
    } else 
    if (tok == TOK_DEFAULT) {
        next();
        skip(':');
        if (!def_sym)
            expect("switch");
        if (*def_sym)
            error("too many 'default'");
        *def_sym = ind;
        block(bsym, csym, case_sym, def_sym, case_reg);
    } else {
        /* expression case */
        if (tok != ';') {
            gexpr();
            vpop();
        }
        skip(';');
    }
}

/* t is the array or struct type. c is the array or struct
   address. cur_index/cur_field is the pointer to the current
   value. 'size_only' is true if only size info is needed (only used
   in arrays) */
void decl_designator(int t, int c, 
                     int *cur_index, Sym **cur_field, 
                     int size_only)
{
    Sym *s, *f;
    int notfirst, index, align, l;

    notfirst = 0;

    while (tok == '[' || tok == '.') {
        if (tok == '[') {
            if (!(t & VT_ARRAY))
                expect("array type");
            s = sym_find(((unsigned)t >> VT_STRUCT_SHIFT));
            next();
            index = expr_const();
            if (index < 0 || (s->c >= 0 && index >= s->c))
                expect("invalid index");
            skip(']');
            if (!notfirst)
                *cur_index = index;
            t = pointed_type(t);
            c += index * type_size(t, &align);
        } else {
            next();
            l = tok;
            next();
            if ((t & VT_BTYPE) != VT_STRUCT)
                expect("struct/union type");
            s = sym_find(((unsigned)t >> VT_STRUCT_SHIFT) | SYM_STRUCT);
            l |= SYM_FIELD;
            f = s->next;
            while (f) {
                if (f->v == l)
                    break;
                f = f->next;
            }
            if (!f)
                expect("field");
            if (!notfirst)
                *cur_field = f;
            t = f->t | (t & ~VT_TYPE);
            c += f->c;
        }
        notfirst = 1;
    }
    if (notfirst) {
        if (tok == '=') {
            next();
        } else {
            if (!gnu_ext)
                expect("=");
        }
    } else {
        if (t & VT_ARRAY) {
            index = *cur_index;
            t = pointed_type(t);
            c += index * type_size(t, &align);
        } else {
            f = *cur_field;
            if (!f)
                error("too many field init");
            t = f->t | (t & ~VT_TYPE);
            c += f->c;
        }
    }
    decl_initializer(t, c, 0, size_only);
}

/* store a value or an expression directly in global data or in local array */

void init_putv(int t, int c, int v, int is_expr)
{
    int saved_global_expr, bt;
    char* charc;
    short* shortc;
    int* intc;

    if ((t & VT_VALMASK) == VT_CONST) {
        if (is_expr) {
            /* compound literals must be allocated globally in this case */
            saved_global_expr = global_expr;
            global_expr = 1;
            expr_const1();
            global_expr = saved_global_expr;
        } else {
            vset(VT_CONST | VT_INT, v);
        }
        /* XXX: do casting */
        /* XXX: not portable */
        bt = vtop->t & VT_BTYPE;
        switch(bt) {
        case VT_BYTE:
            charc = (char*)c;
            *charc = vtop->c.i;
            break;
        case VT_SHORT:
            shortc = (short*)c;
            *shortc = vtop->c.i;
            break;
        default:
            intc = (int*)c;
            *intc = vtop->c.i;
            break;
        }
        vpop();
    } else {
        vset(t, c);
        if (is_expr)
            expr_eq();
        else
            vset(VT_CONST | VT_INT, v);
        vstore();
        vpop();
    }
}

/* put zeros for variable based init */
void init_putz(int t, int c, int size)
{
    GFuncContext gf;

    if ((t & VT_VALMASK) == VT_CONST) {
        /* nothing to do because global are already set to zero */
    } else {
        gfunc_start(&gf);
        vset(VT_CONST, size);
        gfunc_param(&gf);
        vset(VT_CONST, 0);
        gfunc_param(&gf);
        vset(VT_LOCAL, c);
        gfunc_param(&gf);
        vset(VT_CONST, (int)&memset);
if(reloc){
  printf("memset function point stuff\n");
}
        gfunc_call(&gf);
    }
}

/* 't' contains the type and storage info. c is the address of the
   object. 'first' is true if array '{' must be read (multi dimension
   implicit array init handling). 'size_only' is true if size only
   evaluation is wanted (only for arrays). */
void decl_initializer(int t, int c, int first, int size_only)
{
    int index, array_length, n, no_oblock, nb, parlevel, i;
    int t1, size1, align1;
    Sym *s, *f;
    TokenSym *ts;

    if (t & VT_ARRAY) {
        s = sym_find(((unsigned)t >> VT_STRUCT_SHIFT));
        n = s->c;
        array_length = 0;
        t1 = pointed_type(t);
        size1 = type_size(t1, &align1);

        no_oblock = 1;
        if ((first && tok != TOK_LSTR && tok != TOK_STR) || 
            tok == '{') {
            skip('{');
            no_oblock = 0;
        }

        /* only parse strings here if correct type (otherwise: handle
           them as ((w)char *) expressions */
        if ((tok == TOK_LSTR && 
             (t1 & VT_BTYPE) == VT_INT) ||
            (tok == TOK_STR &&
             (t1 & VT_BTYPE) == VT_BYTE)) {
            /* XXX: move multiple string parsing in parser ? */
            while (tok == TOK_STR || tok == TOK_LSTR) {
                ts = tokc.ts;
                /* compute maximum number of chars wanted */
                nb = ts->len;
                if (n >= 0 && nb > (n - array_length))
                    nb = n - array_length;
                if (!size_only) {
                    if (ts->len > nb)
                        warning("initializer-string for array is too long");
                    for(i=0;i<nb;i++) {
                        init_putv(t1, c + (array_length + i) * size1, 
                                  ts->str[i], 0);
                    }
                }
                array_length += nb;
                next();
            }
            /* only add trailing zero if enough storage (no
               warning in this case since it is standard) */
            if (n < 0 || array_length < n) {
                if (!size_only) {
                    init_putv(t1, c + (array_length * size1), 0, 0);
                }
                array_length++;
            }
        } else {
            index = 0;
            while (tok != '}') {
                decl_designator(t, c, &index, NULL, size_only);
                if (n >= 0 && index >= n)
                    error("index too large");
                /* must put zero in holes (note that doing it that way
                   ensures that it even works with designators) */
                if (!size_only && array_length < index) {
                    init_putz(t1, c + array_length * size1, 
                              (index - array_length) * size1);
                }
                index++;
                if (index > array_length)
                    array_length = index;
                /* special test for multi dimensional arrays (may not
                   be strictly correct if designators are used at the
                   same time) */
                if (index >= n && no_oblock)
                    break;
                if (tok == '}')
                    break;
                skip(',');
            }
        }
        if (!no_oblock)
            skip('}');
        /* put zeros at the end */
        if (!size_only && n >= 0 && array_length < n) {
            init_putz(t1, c + array_length * size1, 
                      (n - array_length) * size1);
        }
        /* patch type size if needed */
        if (n < 0)
            s->c = array_length;
    } else if ((t & VT_BTYPE) == VT_STRUCT && tok == '{') {
        /* XXX: union needs only one init */
        next();
        s = sym_find(((unsigned)t >> VT_STRUCT_SHIFT) | SYM_STRUCT);
        f = s->next;
        array_length = 0;
        index = 0;
        n = s->c;
        while (tok != '}') {
            decl_designator(t, c, NULL, &f, size_only);
            /* fill with zero between fields */
            index = f->c;
            if (!size_only && array_length < index) {
                init_putz(t, c + array_length, 
                          index - array_length);
            }
            index = index + type_size(f->t, &align1);
            if (index > array_length)
                array_length = index;
            if (tok == '}')
                break;
            skip(',');
            f = f->next;
        }
        /* put zeros at the end */
        if (!size_only && array_length < n) {
            init_putz(t, c + array_length, 
                      n - array_length);
        }
        skip('}');
    } else if (tok == '{') {
        next();
        decl_initializer(t, c, first, size_only);
        skip('}');
    } else if (size_only) {
        /* just skip expression */
        parlevel = 0;
        while ((parlevel > 0 || (tok != '}' && tok != ',')) && 
               tok != -1) {
            if (tok == '(')
                parlevel++;
            else if (tok == ')')
                parlevel--;
            next();
        }
    } else {
        init_putv(t, c, 0, 1);
    }
}

/* parse an initializer for type 't' if 'has_init' is true, and
   allocate space in local or global data space. The allocated address
   in returned */
int decl_initializer_alloc(int t, int has_init)
{
    int size, align, addr, tok1;
    int *init_str, init_len, level, *saved_macro_ptr;

    size = type_size(t, &align);
    /* If unknown size, we must evaluate it before
       evaluating initializers because
       initializers can generate global data too
       (e.g. string pointers or ISOC99 compound
       literals). It also simplifies local
       initializers handling */
    init_len = 0;
    init_str = NULL;
    saved_macro_ptr = NULL; /* avoid warning */
    tok1 = 0;
    if (size < 0) {
        if (!has_init) 
            error("unknown type size");
        /* get all init string */
        level = 0;
        while (level > 0 || (tok != ',' && tok != ';')) {
            if (tok < 0)
                error("unexpect end of file in initializer");
            tok_add2(&init_str, &init_len, tok, &tokc);
            if (tok == '{')
                level++;
            else if (tok == '}') {
                if (level == 0)
                    break;
                level--;
            }
            next();
        }
        tok1 = tok;
        tok_add(&init_str, &init_len, -1);
        tok_add(&init_str, &init_len, 0);
        
        /* compute size */
        saved_macro_ptr = macro_ptr;
        macro_ptr = init_str;
        next();
        decl_initializer(t, 0, 1, 1);
        /* prepare second initializer parsing */
        macro_ptr = init_str;
        next();
        
        /* if still unknown size, error */
        size = type_size(t, &align);
        if (size < 0) 
            error("unknown type size");
    }
    if ((t & VT_VALMASK) == VT_LOCAL) {
        loc = (loc - size) & -align;
        addr = loc;
    } else {
        glo = (glo + align - 1) & -align;
        addr = glo;
        /* very important to increment global
           pointer at this time because
           initializers themselves can create new
           initializers */
        glo += size;
    }
    if (has_init) {
        decl_initializer(t, addr, 1, 0);
        /* restore parse state if needed */
        if (init_str) {
            free(init_str);
            macro_ptr = saved_macro_ptr;
            tok = tok1;
        }
    }
    return addr;
}


/* 'l' is VT_LOCAL or VT_CONST to define default storage type */
void decl(int l)
{
    int *a, t, b, v, u, addr, has_init, size, align;
    Sym *sym;
    
    while (1) {
        b = ist();
        if (!b) {
            /* skip redundant ';' */
            /* XXX: find more elegant solution */
            if (tok == ';') {
                next();
                continue;
            }
            /* special test for old K&R protos without explicit int
               type. Only accepted when defining global data */
            if (l == VT_LOCAL || tok < TOK_DEFINE)
                break;
            b = VT_INT;
        }
        if (((b & VT_BTYPE) == VT_ENUM ||
             (b & VT_BTYPE) == VT_STRUCT) && 
            tok == ';') {
            /* we accept no variable after */
            next();
            continue;
        }
        while (1) { /* iterate thru each declaration */
            t = type_decl(&v, b, TYPE_DIRECT);
            if (tok == '{') {
                if (l == VT_LOCAL)
                    error("cannot use local functions");
                if (!(t & VT_FUNC))
                    expect("function definition");
                /* patch forward references */
                if ((sym = sym_find(v)) && (sym->t & VT_FORWARD)) {
                    greloc_patch(sym, ind);
                    sym->t = VT_CONST | t;
                } else {
                    /* put function address */
                    sym_push1(&global_stack, v, VT_CONST | t, ind);
                }
                funcname = get_tok_str(v, NULL);
                /* push a dummy symbol to enable local sym storage */
                sym_push1(&local_stack, 0, 0, 0);
                /* define parameters */
                sym = sym_find((unsigned)t >> VT_STRUCT_SHIFT);
                /* XXX: the following is x86 dependant -> move it to
                   x86 code gen */
                addr = 8;
                /* if the function returns a structure, then add an
                   implicit pointer parameter */
                func_vt = sym->t;
                if ((func_vt & VT_BTYPE) == VT_STRUCT) {
                    func_vc = addr;
                    addr += 4;
                }
                while (sym = sym->next) {
                    u = sym->t;
                    sym_push(sym->v & ~SYM_FIELD, 
                             u | VT_LOCAL | VT_LVAL, 
                             addr);
                    size = type_size(u, &align);
                    size = (size + 3) & ~3;
                    addr += size;
                }
                loc = 0;
                o(0xe58955); /* push   %ebp, mov    %esp, %ebp */
                a = (int *)oad(0xec81, 0); /* sub $xxx, %esp */
                rsym = 0;
                block(NULL, NULL, NULL, NULL, 0);
                gsym(rsym);
                o(0xc3c9); /* leave, ret */
                *a = (-loc + 3) & -4; /* align local size to word & 
                                         save local variables */
                sym_pop(&label_stack, NULL); /* reset label stack */
                sym_pop(&local_stack, NULL); /* reset local stack */
                funcname = ""; /* for safety */
                func_vt = VT_VOID; /* for safety */
                break;
            } else {
                if (b & VT_TYPEDEF) {
                    /* save typedefed type  */
                    /* XXX: test storage specifiers ? */
                    sym_push(v, t | VT_TYPEDEF, 0);
                } else if ((t & VT_BTYPE) == VT_FUNC) {
                    /* external function definition */
                    external_sym(v, t);
                } else {
                    /* not lvalue if array */
                    if (!(t & VT_ARRAY))
                        t |= VT_LVAL;
                    if (b & VT_EXTERN) {
                        /* external variable */
                        external_sym(v, t);
                    } else {
                        u = l;
                        if (t & VT_STATIC)
                            u = VT_CONST;
                        u |= t;
                        has_init = (tok == '=');
                        if (has_init)
                            next();
                        addr = decl_initializer_alloc(u, has_init);
                        while(1){
                        if (l == VT_CONST) {
                            /* global scope: see if already defined */
                            sym = sym_find(v);
                            if (!sym) {
                                sym_push(v, u, addr);
                                break;
                            }
                            if (!is_compatible_types(sym->t, u))
                                error("incompatible types for redefinition of '%s'", 
                                      get_tok_str(v, NULL));
                            if (!(sym->t & VT_FORWARD))
                                error("redefinition of '%s'", get_tok_str(v, NULL));
                            greloc_patch(sym, addr);
                        } else {
                            sym_push(v, u, addr);
                        }
                        break;
                        }
                    }
                }
                if (tok != ',') {
                    skip(';');
                    break;
                }
                next();
            }
        }
    }
}

/* put all global symbols in the extern stack and do all the
   resolving which can be done without using external symbols from DLLs */
/* XXX: could try to verify types, but would not to save them in
   extern_stack too */
void resolve_global_syms(void)
{
    Sym *s, *s1, *ext_sym;
    Reloc **p;

    s = global_stack.top;
    while (s != NULL) {
        s1 = s->prev;
        /* do not save static or typedefed symbols or types */
        if (!(s->t & (VT_STATIC | VT_TYPEDEF)) && 
            !(s->v & (SYM_FIELD | SYM_STRUCT)) &&
            (s->v < SYM_FIRST_ANOM)) {
            ext_sym = sym_find1(&extern_stack, s->v);
            if (!ext_sym) {
                /* if the symbol do not exist, we simply save it */
                sym_push1(&extern_stack, s->v, s->t, s->c);
            } else if (ext_sym->t & VT_FORWARD) {
                /* external symbol already exists, but only as forward
                   definition */
                if (!(s->t & VT_FORWARD)) {
                    /* s is not forward, so we can relocate all symbols */
                    greloc_patch(ext_sym, s->c);
                } else {
                    /* the two symbols are forward: merge them */
                    p = (Reloc **)&ext_sym->c;
                    while (*p != NULL)
                        p = &(*p)->next;
                    *p = (Reloc *)s->c;
                }
            } else {
                /* external symbol already exists and is defined :
                   patch all references to it */
                if (!(s->t & VT_FORWARD))
                    error("'%s' defined twice", get_tok_str(s->v, NULL));
                greloc_patch(s, ext_sym->c);
            }
        } 
        s = s1;
    }
}

/* compile a C file. Return non zero if errors. */
int tcc_compile_file(const char *filename1)
{
    Sym *define_start;

    filename = (char *)filename1;

    line_num = 1;
    funcname = "";
    file = fopen(filename, "r");
    if (!file)
        error("file '%s' not found", filename);
    include_stack_ptr = include_stack;
    ifdef_stack_ptr = ifdef_stack;

    vtop = vstack - 1;
    anon_sym = SYM_FIRST_ANOM; 
    
    define_start = define_stack.top;
    inp();
    ch = '\n'; /* needed to parse correctly first preprocessor command */
    next();
    decl(VT_CONST);
    if (tok != -1)
        expect("declaration");
    fclose(file);

    /* reset define stack, but leave -Dsymbols (may be incorrect if
       they are undefined) */
    sym_pop(&define_stack, define_start); 
    
    resolve_global_syms();
    
    sym_pop(&global_stack, NULL);
    
    return 0;
}

void resolve_extern_syms(void)
{
// HACK RELOC
reloc_global=1;
    Sym *s, *s1;
    char *str;
    int addr;
int count;
    s = extern_stack.top;
    while (s != NULL) {
        s1 = s->prev;
        if (s->t & VT_FORWARD) {
            /* if there is at least one relocation to do, then find it
               and patch it */
            if (s->c) {
                str = get_tok_str(s->v, NULL);
                addr = (int)dlsym(NULL, str);
                if (!addr)
                    error("unresolved external reference '%s'", str);
                count=greloc_patch(s, addr);
if(reloc){
  printf("resolve_extern_syms: %s %d\n",str,count);
  strcpy((char *)global_relocs_table,str);
  global_relocs_table+=strlen(str)+1;
  int* intglobal_relocs_table = (int*)global_relocs_table;
  *intglobal_relocs_table=count;
  global_relocs_table+=4;
}
            }
        }
        s = s1;
    }
reloc_global=0;
}

int show_help(void)
{
    printf("tcc version 0.9.2 - Tiny C Compiler - Copyright (C) 2001 Fabrice Bellard\n"
           "usage: tcc [-Idir] [-Dsym] [-llib] [-i infile] infile [infile_args...]\n");
    return 1;
}

int r32(int o){
  int r;
  r=((int *)(o))[0];
//  printf("r32: %x\n",r);
  return r;
}

int w32(int o,int v){
// return 0;
  int* into = (int*)o;
  *into=v;
}
void gen_obj(int e){
  printf("Generating object file\n");
  FILE *f;
  int text_len=ind-prog;
  int data_len=glo-glo_base;
  int reloc_len=relocs-relocs_base;
  int global_reloc_len=global_relocs-global_relocs_base;
  int global_reloc_table_len=global_relocs_table-global_relocs_table_base;
  int prog_rel;
  int data_rel;
  int entrypoint=e-prog;
  int m0=0xdeadbe00;
  int m1=0xdeadbe01;
  int m2=0xdeadbe02;
  int m3=0xdeadbe03;
  int m4=0xdeadbe04;
  int i;
  f = fopen("tcc_boot.o", "wb");
  fwrite(&entrypoint,1,4,f);
  fwrite(&text_len,1,4,f);
  fwrite(&data_len,1,4,f);
  fwrite(&reloc_len,1,4,f);
  fwrite(&global_reloc_len,1,4,f);
  fwrite(&global_reloc_table_len,1,4,f);
  fwrite(&m0,1,4,f);
  fwrite((void *)global_relocs_table_base,1,global_reloc_table_len,f);
  prog_rel=(int)malloc(text_len);
  data_rel=(int)malloc(data_len);

  memcpy((char *)prog_rel,(char *)prog,text_len);
  memcpy((char *)data_rel,(char *)glo_base,data_len);

  fwrite(&m1,1,4,f);
  fwrite((void *)relocs_base,1,reloc_len,f);

  fwrite(&m2,1,4,f);
  fwrite((void *)data_rel,1,data_len,f);

  fwrite(&m3,1,4,f);
  fwrite((void *)global_relocs_base,1,global_reloc_len,f);

  for(i=0;i<reloc_len;i=i+12){
    w32(prog_rel+r32(relocs_base+i),0); 
  }
  for(i=0;i<global_reloc_len;i=i+8){
    w32(prog_rel+r32(global_relocs_base+i+4),0); 
  }

  fwrite(&m4,1,4,f);
  fwrite((void *)prog_rel,1,text_len,f);
  fclose(f);
}

int prog_rel;
int data_rel;

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
  int* intaddr;
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
          intaddr = (int*)addr;
          *intaddr=a;
          break;
        case RELOC_REL32:
          printf("Reloc type RELOC_REL32 at %x\n",addr);
          intaddr = (int*)addr;
          *intaddr = a - addr - 4;
          break;
      }
      goff=goff+8;
    }
  }
  return prog+entrypoint;
}

int main(int argc, char **argv)
{
    puts("tcc 1_7 start");
    Sym *s;
    int (*t)();
    char *p, *r, *outfile;
    int optind;

    include_paths[0] = "../tcc_1_7/";
    nb_include_paths = 1;

    /* add all tokens */
    tok_ident = TOK_IDENT;
    p = "int\0void\0char\0if\0else\0while\0break\0return\0for\0extern\0static\0unsigned\0goto\0do\0continue\0switch\0case\0const\0volatile\0long\0register\0signed\0auto\0inline\0restrict\0float\0double\0_Bool\0short\0struct\0union\0typedef\0default\0enum\0sizeof\0define\0include\0ifdef\0ifndef\0elif\0endif\0defined\0undef\0error\0line\0__LINE__\0__FILE__\0__DATE__\0__TIME__\0__VA_ARGS__\0__func__\0main\0";
    while (*p) {
        r = p;
        while (*r++);
        tok_alloc(p, r - p - 1);
        p = r;
    }

    /* standard defines */
    define_symbol("__STDC__");
    define_symbol("__i386__");
    /* tiny C specific defines */
    define_symbol("__TINYC__");
    
    glo = (int)mmap(NULL, DATA_SIZE,
                PROT_READ | PROT_WRITE,
                MAP_PRIVATE | MAP_ANONYMOUS,
                -1, 0);
    glo_base=glo;
    printf("glo: %x %x\n",glo,glo_base);
    //memset((void *)glo, 0, DATA_SIZE);
    prog = (int)mmap(NULL, TEXT_SIZE,
                PROT_EXEC | PROT_READ | PROT_WRITE,
                MAP_PRIVATE | MAP_ANONYMOUS,
                -1, 0);
    ind = prog;
    printf("prog: %x \n",prog);

    optind = 1;
    outfile = NULL;
int loader=0;
    while (1) {
printf("argc %d\n",argc);
        if (optind >= argc) {
        return show_help();
        }
        r = argv[optind];
        if (r[0] != '-')
            break;
        optind++;
        if (r[1] == 'I') {
            if (nb_include_paths >= INCLUDE_PATHS_MAX)
                error("too many include paths");
            include_paths[nb_include_paths++] = r + 2;
        } else if (r[1] == 'D') {
            define_symbol(r + 2);
        } else if (r[1] == 'i') {
            if (optind >= argc)
                return show_help();
            tcc_compile_file(argv[optind++]);
        } else if (r[1] == 'r') {
            reloc=1;
        } else if (r[1] == 'R') {
            t=(int (*)())load_obj();
            loader=1;
        } else {
            fprintf(stderr, "invalid option -- '%s'\n", r);
            exit(1);
        }
    }

if(loader){
  printf("running loader\n");
  return (*t)(argc - optind, argv + optind);
}
if(reloc){
global_relocs=(int)malloc(64*1024);
global_relocs_base=global_relocs;

printf("global_relocs %d\n",global_relocs);

global_relocs_table=(int)malloc(64*1024);
global_relocs_table_base=global_relocs_table;

relocs=(int)malloc(64*1024);
relocs_base=relocs;

};

    tcc_compile_file(argv[optind]);
    puts("tcc 1_7 compile done");

    resolve_extern_syms();
    s = sym_find1(&extern_stack, TOK_MAIN);
    if (!s || (s->t & VT_FORWARD))
        error("main() not defined");

if(reloc){
  gen_obj(s->c);
}

    t = (int (*)())s->c;
    return (*t)(argc - optind, argv + optind);
}
