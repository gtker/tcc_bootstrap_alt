print("tcc.js start");
load("support.js");
load("metadata.js");

var NULL=0;

// /*
//  *  TCC - Tiny C Compiler
//  * 
//  *  Copyright (c) 2001 Fabrice Bellard
//  *
//  *  This program is free software; you can redistribute it and/or modify
//  *  it under the terms of the GNU General Public License as published by
//  *  the Free Software Foundation; either version 2 of the License, or
//  *  (at your option) any later version.
//  *
//  *  This program is distributed in the hope that it will be useful,
//  *  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  *  GNU General Public License for more details.
//  *
//  *  You should have received a copy of the GNU General Public License
//  *  along with this program; if not, write to the Free Software
//  *  Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
//  */
// 
// #include <tcclib.h>
// 
// /* these sizes are dummy for unix, because malloc() does not use
//    memory when the pages are not used */
// #define TEXT_SIZE           (256*1024)
var TEXT_SIZE = (256*1024);
// #define DATA_SIZE           (256*1024)
var DATA_SIZE = (256*1024);
// 
// #define INCLUDE_STACK_SIZE  32
var INCLUDE_STACK_SIZE = 32;
// #define IFDEF_STACK_SIZE    64
// #define VSTACK_SIZE         64
var VSTACK_SIZE = 64;
// #define STRING_MAX_SIZE     1024
var STRING_MAX_SIZE = 1024;
// #define INCLUDE_PATHS_MAX   32
var INCLUDE_PATHS_MAX = 32;
// 
// #define TOK_HASH_SIZE       521
var TOK_HASH_SIZE = 521;
// #define TOK_ALLOC_INCR      256 /* must be a power of two */
var TOK_ALLOC_INCR = 256;
// #define SYM_HASH_SIZE       263
var SYM_HASH_SIZE = 263;
// 
// /* token symbol management */
// typedef struct TokenSym {
//     struct TokenSym *hash_next;
var TokenSym_hash_next_o=0;
//     int tok; /* token number */
var TokenSym_tok_o=4;
//     int len;
var TokenSym_len_o=8;
//     char str[1];
var TokenSym_str_o=12;
// } TokenSym;
// 
// /* constant value */
// typedef union CValue {
//     int i;
//     unsigned int ui;
//     unsigned int ul; /* address (should be unsigned long on 64 bit cpu) */
//     struct TokenSym *ts;
//     int tab[1];
//     struct Sym *sym;
// } CValue;
// 
// /* value on stack */
// typedef struct SValue {
//     int t;
var SValue_t_o=0;
//     CValue c;
var SValue_c_o=4;
// } SValue;
// 
// /* symbol management */
// typedef struct Sym {
//     int v;    /* symbol token */
var Sym_v_o=0;
//     int t;    /* associated type */
var Sym_t_o=4;
//     int c;    /* associated number */
var Sym_c_o=8;
//     struct Sym *next; /* next related symbol */
var Sym_next_o=12;
//     struct Sym *prev; /* prev symbol in stack */
var Sym_prev_o=16;
//     struct Sym *hash_next; /* next symbol in hash table */
var Sym_hash_next_o=20;
// } Sym;
// 
// typedef struct SymStack {
//   struct Sym *top;
var SymStack_top_o=0;
//   struct Sym *hash[SYM_HASH_SIZE];
var SymStack_hash_o=4;
// } SymStack;
// 
// /* relocation entry (currently only used for functions or variables */
// typedef struct Reloc {
//     int type;            /* type of relocation */
var Reloc_type_o=0;
//     int addr;            /* address of relocation */
var Reloc_addr_o=4;
//     struct Reloc *next;  /* next relocation */
var Reloc_next_o=8;
// } Reloc;
// 
// #define RELOC_ADDR32 1  /* 32 bits relocation */
var RELOC_ADDR32 = 1;
// #define RELOC_REL32  2  /* 32 bits relative relocation */
var RELOC_REL32 = 2;
// 
// 
// #define SYM_STRUCT     0x40000000 /* struct/union/enum symbol space */
// #define SYM_FIELD      0x20000000 /* struct/union field symbol space */
// #define SYM_FIRST_ANOM (1 << (31 - VT_STRUCT_SHIFT)) /* first anonymous sym */
// 
// #define FUNC_NEW       1 /* ansi function prototype */
var FUNC_NEW = 1;
// #define FUNC_OLD       2 /* old function prototype */
var FUNC_OLD = 2;
// #define FUNC_ELLIPSIS  3 /* ansi function prototype with ... */
var FUNC_ELLIPSIS = 3;
// 
// /* field 'Sym.t' for macros */
// #define MACRO_OBJ      0 /* object like macro */
var MACRO_OBJ = 0;
// #define MACRO_FUNC     1 /* function like macro */
// 
// /* type_decl() types */
// #define TYPE_ABSTRACT  1 /* type without variable */
var TYPE_ABSTRACT = 1;
// #define TYPE_DIRECT    2 /* type with variable */
var TYPE_DIRECT = 2;
// 
// typedef struct {
//     FILE *file;
var IncludeFile_file_o=0;
//     char *filename;
var IncludeFile_filename_o=4;
//     int line_num;
var IncludeFile_line_num_o=8;
// } IncludeFile;
// 
// int special=0;
var special=0;
// 
// /* parser */
// FILE *file;
// int line_num;
var line_num=0;
// int ch, ch1, tok, tok1;
var ch;
var ch1;
var tok;
var tok1;
// CValue tokc, tok1c;
var tokc=malloc(CValue_size);
var tok1c=malloc(CValue_size);
// 
// /* loc : local variable index
//    glo : global variable index
//    ind : output code ptr
//    rsym: return symbol
//    prog: output code
//    anon_sym: anonymous symbol index
// */
// int rsym, anon_sym,
var rsym;
var anon_sym;
//     prog, ind, loc, glo, const_wanted, glo_base;
var prog;
var ind;
var loc;
var glo;
var glo_base;
var const_wanted=0;
// int global_expr; /* true if compound literals must be allocated
//                     globally (used during initializers parsing */
var global_expr=0;
//                     globally (used during initializers parsing */
// int func_vt, func_vc; /* current function return type (used by
//                          return instruction) */
// int tok_ident;
var tok_ident;
// TokenSym **table_ident;
var table_ident;
// TokenSym *hash_ident[TOK_HASH_SIZE];
var hash_ident=malloc(TOK_HASH_SIZE*4);
// char token_buf[STRING_MAX_SIZE + 1];
var token_buf=malloc(STRING_MAX_SIZE + 1);
// char *filename, *funcname;
var filename;
var funcname;
// /* contains global symbols which remain between each translation unit */
// SymStack extern_stack;
// SymStack define_stack, global_stack, local_stack, label_stack;
var define_stack=malloc(SymStack_size);
var local_stack=malloc(SymStack_size);
var global_stack=malloc(SymStack_size);
var extern_stack=malloc(SymStack_size);
// 
// SValue vstack[VSTACK_SIZE], *vtop;
var vstack=malloc(SValue_size*VSTACK_SIZE);
var vtop;
// int *macro_ptr, *macro_ptr_allocated;
var macro_ptr=malloc(4);
var macro_ptr_allocated=0;
// IncludeFile include_stack[INCLUDE_STACK_SIZE], *include_stack_ptr;
var include_stack=malloc(IncludeFile_size*INCLUDE_STACK_SIZE);
var include_stack_ptr;
// int ifdef_stack[IFDEF_STACK_SIZE], *ifdef_stack_ptr;
// char *include_paths[INCLUDE_PATHS_MAX];
var include_paths = malloc(4*INCLUDE_PATHS_MAX);
// int nb_include_paths;
var nb_include_paths=0;
// 
// /* use GNU C extensions */
// int gnu_ext = 0;
// 
// /* use Tiny C extensions */
// int tcc_ext = 1;
var tcc_ext = 1;
// 
// int reloc=0;
var reloc=0;
// int reloc_global=0;
var reloc_global=0;
// 
// int relocs;
var relocs;
// int relocs_base;
var relocs_base;
// 
// int global_relocs;
var global_relocs;
// int global_relocs_base;
var global_relocs_base;
// 
// int global_relocs_table;
var global_relocs_table;
// int global_relocs_table_base;
var global_relocs_table_base;
// 
// /* The current value can be: */
// #define VT_VALMASK 0x000f
var VT_VALMASK = 0x000f;
// #define VT_CONST   0x000a  /* constant in vc 
var VT_CONST = 0x000a;
//                               (must be first non register value) */
// #define VT_LLOCAL  0x000b  /* lvalue, offset on stack */
// #define VT_LOCAL   0x000c  /* offset on stack */
// #define VT_CMP     0x000d  /* the value is stored in processor flags (in vc) */
// #define VT_JMP     0x000e  /* value is the consequence of jmp true */
// #define VT_JMPI    0x000f  /* value is the consequence of jmp false */
// #define VT_LVAL    0x0010  /* var is an lvalue */
var VT_LVAL = 0x0010;
// #define VT_LVALN   -17         /* ~VT_LVAL */
// #define VT_FORWARD 0x0020  /* value is forward reference 
//                               (only used for functions) */
// /* storage */
// #define VT_EXTERN  0x00000040  /* extern definition */
// #define VT_STATIC  0x00000080  /* static variable */
// #define VT_TYPEDEF 0x00000100  /* typedef definition */
// 
// /* types */
// #define VT_STRUCT_SHIFT 16   /* structure/enum name shift (16 bits left) */
// 
// #define VT_BTYPE_SHIFT 9
// #define VT_INT        (0 << VT_BTYPE_SHIFT)  /* integer type */
// #define VT_BYTE       (1 << VT_BTYPE_SHIFT)  /* signed byte type */
// #define VT_SHORT      (2 << VT_BTYPE_SHIFT)  /* short type */
// #define VT_VOID       (3 << VT_BTYPE_SHIFT)  /* void type */
// #define VT_PTR        (4 << VT_BTYPE_SHIFT)  /* pointer increment */
// #define VT_ENUM       (5 << VT_BTYPE_SHIFT)  /* enum definition */
// #define VT_FUNC       (6 << VT_BTYPE_SHIFT)  /* function type */
// #define VT_STRUCT     (7 << VT_BTYPE_SHIFT)  /* struct/union definition */
// #define VT_FLOAT      (8 << VT_BTYPE_SHIFT)  /* IEEE float */
// #define VT_DOUBLE     (9 << VT_BTYPE_SHIFT)  /* IEEE double */
// #define VT_LDOUBLE   (10 << VT_BTYPE_SHIFT)  /* IEEE long double */
// #define VT_BOOL      (11 << VT_BTYPE_SHIFT)  /* ISOC99 boolean type */
// #define VT_LLONG     (12 << VT_BTYPE_SHIFT)  /* 64 bit integer */
// #define VT_LONG      (13 << VT_BTYPE_SHIFT)  /* long integer (NEVER
//                                                 USED as type, only
//                                                 during parsing) */
// #define VT_BTYPE      (0xf << VT_BTYPE_SHIFT) /* mask for basic type */
// #define VT_UNSIGNED   (0x10 << VT_BTYPE_SHIFT)  /* unsigned type */
// #define VT_ARRAY      (0x20 << VT_BTYPE_SHIFT)  /* array type (also has VT_PTR) */
// #define VT_BITFIELD   (0x40 << VT_BTYPE_SHIFT)  /* bitfield modifier */
// 
// #define VT_TYPE    0xfffffe00  /* type mask */
// 
// /* token values */
// 
// /* warning: the following compare tokens depend on i386 asm code */
// #define TOK_ULT 0x92
// #define TOK_UGE 0x93
// #define TOK_EQ  0x94
// #define TOK_NE  0x95
// #define TOK_ULE 0x96
// #define TOK_UGT 0x97
// #define TOK_LT  0x9c
// #define TOK_GE  0x9d
// #define TOK_LE  0x9e
// #define TOK_GT  0x9f
// 
// #define TOK_LAND  0xa0
// #define TOK_LOR   0xa1
// 
// #define TOK_DEC   0xa2
// #define TOK_MID   0xa3 /* inc/dec, to void constant */
// #define TOK_INC   0xa4
// #define TOK_ARROW 0xa7 
// #define TOK_DOTS  0xa8 /* three dots */
// #define TOK_SHR   0xa9 /* unsigned shift right */
// #define TOK_UDIV  0xb0 /* unsigned division */
// #define TOK_UMOD  0xb1 /* unsigned modulo */
// #define TOK_PDIV  0xb2 /* fast division with undefined rounding for pointers */
// #define TOK_NUM   0xb3 /* number in tokc */
// #define TOK_CCHAR 0xb4 /* char constant in tokc */
// #define TOK_STR   0xb5 /* pointer to string in tokc */
// #define TOK_TWOSHARPS 0xb6 /* ## preprocessing token */
// #define TOK_LCHAR 0xb7
// #define TOK_LSTR  0xb8
// #define TOK_CFLOAT   0xb9 /* float constant */
// #define TOK_CDOUBLE  0xc0 /* double constant */
// #define TOK_CLDOUBLE 0xc1 /* long double constant */
// 
//  #define TOK_SHL   0x01 /* shift left */
// #define TOK_SAR   0x02 /* signed shift right */
//   
// /* assignement operators : normal operator or 0x80 */
// #define TOK_A_MOD 0xa5
// #define TOK_A_AND 0xa6
// #define TOK_A_MUL 0xaa
// #define TOK_A_ADD 0xab
// #define TOK_A_SUB 0xad
// #define TOK_A_DIV 0xaf
// #define TOK_A_XOR 0xde
// #define TOK_A_OR  0xfc
// #define TOK_A_SHL 0x81
// #define TOK_A_SAR 0x82
// 
// /* all identificators and strings have token above that */
// #define TOK_IDENT 256
// 
// enum {
//     TOK_INT = TOK_IDENT,
//     TOK_VOID,
//     TOK_CHAR,
//     TOK_IF,
//     TOK_ELSE,
//     TOK_WHILE,
//     TOK_BREAK,
//     TOK_RETURN,
//     TOK_FOR,
//     TOK_EXTERN,
//     TOK_STATIC,
//     TOK_UNSIGNED,
//     TOK_GOTO,
//     TOK_DO,
//     TOK_CONTINUE,
//     TOK_SWITCH,
//     TOK_CASE,
// 
//     /* ignored types Must have contiguous values */
//     TOK_CONST,
//     TOK_VOLATILE,
//     TOK_LONG,
//     TOK_REGISTER,
//     TOK_SIGNED,
//     TOK_AUTO,
//     TOK_INLINE,
//     TOK_RESTRICT,
// 
//     /* unsupported type */
//     TOK_FLOAT,
//     TOK_DOUBLE,
//     TOK_BOOL,
// 
//     TOK_SHORT,
//     TOK_STRUCT,
//     TOK_UNION,
//     TOK_TYPEDEF,
//     TOK_DEFAULT,
//     TOK_ENUM,
//     TOK_SIZEOF,
// 
//     /* preprocessor only */
//     TOK_UIDENT, /* first "user" ident (not keyword) */
//     TOK_DEFINE = TOK_UIDENT,
//     TOK_INCLUDE,
//     TOK_IFDEF,
//     TOK_IFNDEF,
//     TOK_ELIF,
//     TOK_ENDIF,
//     TOK_DEFINED,
//     TOK_UNDEF,
//     TOK_ERROR,
//     TOK_LINE,
//     TOK___LINE__,
//     TOK___FILE__,
//     TOK___DATE__,
//     TOK___TIME__,
//     TOK___VA_ARGS__,
// 
//     /* special identifiers */
//     TOK___FUNC__,
//     TOK_MAIN,
// };
// 
// void sum(int l);
// void next(void);
// void next_nomacro(void);
// int expr_const(void);
// void expr_eq(void);
// void gexpr(void);
// void decl(int l);
// void decl_initializer(int t, int c, int first, int size_only);
// int decl_initializer_alloc(int t, int has_init);
// int gv(void);
// void move_reg(int r, int s);
// void save_reg(int r);
// void vpop(void);
// void vswap(void);
// void vdup(void);
// int get_reg(int rc);
// 
// void macro_subst(int **tok_str, int *tok_len, 
//                  Sym **nested_list, int *macro_str);
// int save_reg_forced(int r);
// void gen_op(int op);
// void gen_cast(int t);
// void vstore(void);
// int type_size(int t, int *a);
// int pointed_type(int t);
// int pointed_size(int t);
// int ist(void);
// int type_decl(int *v, int t, int td);
// void error(const char *fmt, ...);
// void vset(int t, int v);
// void printline2(void);
// 
// #include "i386-gen.c"
load("i386-gen.js");

// static inline int isid(int c)
function isid(c) {
    return (c >= mk_char('a') && c <= mk_char('z')) ||
        (c >= mk_char('A') && c <= mk_char('Z')) ||
        c == mk_char('_');
}

// static inline int isnum(int c)
function isnum(c) {
    return c >= mk_char('0') & c <= mk_char('9');
}

// static inline int toup(int c)
// {
//     if (ch >= 'a' && ch <= 'z')
//         return ch - 'a' + 'A';
//     else
//         return ch;
// }
// 
// void printline(void)
// {
//     IncludeFile *f;
//     for(f = include_stack; f < include_stack_ptr; f++)
//         fprintf(stderr, "In file included from %s:%d:\n", 
//                 f->filename, f->line_num);
//     fprintf(stderr, "%s:%d: ", filename, line_num);
// }
// 
// void printline2(void)
// {
//     IncludeFile *f;
//     for(f = include_stack; f < include_stack_ptr; f++)
//         fprintf(stdout, "In file included from %s:%d:\n", 
//                 f->filename, f->line_num);
//     fprintf(stdout, "%s:%d: ", filename, line_num);
// }
// 
// void error(const char *fmt, ...)
// {
//     va_list ap;
// //    va_start(ap, fmt);
//     ap = ((char *)&(fmt)) + sizeof(int);
//     printline();
//     vfprintf(stderr, fmt, ap);
//     fprintf(stderr, "\n");
//     exit(1);
// //    va_end(ap);
// }
// 
// void expect(const char *msg)
// {
//     error("%s expected", msg);
// }
// 
// void warning(const char *msg)
// {
//     printline();
//     fprintf(stderr, "warning: %s\n", msg);
// }

// void skip(int c)
function skip(c) {
    if (tok !== c) {
        error("'%c' expected", c);
    }
    next();
}

// void test_lvalue(void)
function test_lvalue() {
    if (!(ri32(vtop+SValue_t_o) & VT_LVAL))
        expect("lvalue");
}

// TokenSym *tok_alloc(char *str, int len)
function tok_alloc(str, len) {
    enter();
    print("tok_alloc str: "+to_hex(str)+" len: "+len+ " str contents: "+ mk_js_string_len(str,len));
//     TokenSym *ts, **pts, **ptable;
    var ts=alloca(4);
    var pts=alloca(4);
    var ptable=alloca(4);
//     int h, i;
    var h;
    var i;

    if (len <= 0) {
        len = strlen(str);
    print("tok_alloc str: "+to_hex(str)+" len: "+len+ " str contents: "+ mk_js_string_len(str,len));
    };
print("len: "+len);
//     h = 1;
    h = 1;
//     for(i=0;i<len;i++)
    for(i=0;i<len;i++) {
//         h = ((h << 8) | (str[i] & 0xff)) % TOK_HASH_SIZE;
        h = ((h << 8) | (ri8(str+i) & 0xff)) % TOK_HASH_SIZE;
    };
// 
print("h: "+h);
if(h===28){
  print("int?");
};
//     pts = &hash_ident[h];
print("hash_ident: "+to_hex(hash_ident));
    wi32(pts, hash_ident+(h*4));
print("pts: "+to_hex(pts));
//     while (1) {
    while (1) {
//         ts = *pts;
        ts = ri32(ri32(pts));
print("ts: "+ts);
//         if (!ts)
        if (!ts) {
//             break;
            break;
        };
//         if (ts->len == len && !memcmp(ts->str, str, len))
print("len: "+len+" ts-table_ident:"+(ts-table_ident));
        if ((ri32(ts+TokenSym_len_o) == len) && !memcmp(ts+TokenSym_str_o, str, len)) {
//             return ts;
            return leave(ts);
        }
//         pts = &(ts->hash_next);
        wi32(pts, ts+TokenSym_hash_next_o);
//     }
    }
// 
//     if (tok_ident >= SYM_FIRST_ANOM) 
    if (tok_ident >= SYM_FIRST_ANOM) {
//         error("memory full");
        error("memory full");
    };
// 
//     /* expand token table if needed */
//     i = tok_ident - TOK_IDENT;
    i = tok_ident - TOK_IDENT;
//     if ((i % TOK_ALLOC_INCR) == 0) {
    if ((i % TOK_ALLOC_INCR) == 0) {
//         ptable = realloc(table_ident, (i + TOK_ALLOC_INCR) * sizeof(TokenSym *));
        wi32(ptable, realloc(table_ident, (i + TOK_ALLOC_INCR) * 4));
//         if (!ptable)
        if (!ptable) {
//             error("memory full");
            error("memory full");
        };
//         table_ident = ptable;
        table_ident = ri32(ptable);
//     }
    }
// 
//     ts = malloc(sizeof(TokenSym) + len);
    ts = malloc(TokenSym_size + len);
//     if (!ts)
     if (!ts) {
//         error("memory full");
         error("memory full");
     };
//     table_ident[i] = ts;
    wi32(table_ident+(i*4), ts);
//     ts->tok = tok_ident++;
    wi32(ts+TokenSym_tok_o , tok_ident++);
//     ts->len = len;
    wi32(ts+TokenSym_len_o, len);
//     ts->hash_next = NULL;
    wi32(ts+TokenSym_hash_next_o,0);
//     memcpy(ts->str, str, len + 1);
    memcpy(ts+TokenSym_str_o, str, len + 1);
//     *pts = ts;
    wi32(ri32(pts),ts);
//     return ts;
    return leave(ts);
// }
}
// 
// void add_char(char **pp, int c)
// {
//     char *p;
//     p = *pp;
//     if (c == '\'' || c == '\"' || c == '\\') {
//         /* XXX: could be more precise if char or string */
//         *p++ = '\\';
//     }
//     if (c >= 32 && c <= 126) {
//         *p++ = c;
//     } else {
//         *p++ = '\\';
//         if (c == '\n') {
//             *p++ = 'n';
//         } else {
//             *p++ = '0' + ((c >> 6) & 7);
//             *p++ = '0' + ((c >> 3) & 7);
//             *p++ = '0' + (c & 7);
//         }
//     }
//     *pp = p;
// }
// 
// /* XXX: buffer overflow */
// char *get_tok_str(int v, CValue *cv)
// {
function get_tok_str(v, cv) {
    enter();
//     static char buf[STRING_MAX_SIZE + 1];
// FIXME ljw should this be reserved on the heap?
    var buf=alloca(STRING_MAX_SIZE + 1);
//     TokenSym *ts;
    var ts;
//     char *p;
    var p=alloca(4);
//     int i;
    var i;
// 
print("v: "+v);
//     if (v == TOK_NUM) {
    if (v === TOK_NUM) {
err();
//         sprintf(buf, "%u", cv->ui);
//         return buf;
//     } else if (v == TOK_CCHAR || v == TOK_LCHAR) {
    } else if (v === TOK_CCHAR || v === TOK_LCHAR) {
err();
//         p = buf;
//         *p++ = '\'';
//         add_char(&p, cv->i);
//         *p++ = '\'';
//         *p = '\0';
//         return buf;
//     } else if (v == TOK_STR || v == TOK_LSTR) {
    } else if (v === TOK_STR || v === TOK_LSTR) {
err();
//         ts = cv->ts;
//         p = buf;
//         *p++ = '\"';
//         for(i=0;i<ts->len;i++)
//             add_char(&p, ts->str[i]);
//         *p++ = '\"';
//         *p = '\0';
//         return buf;
//     } else if (v < TOK_IDENT) {
    } else if (v < TOK_IDENT) {
err();
//         p = buf;
//         *p++ = v;
//         *p = '\0';
//         return buf;
//     } else if (v < tok_ident) {
    } else if (v < tok_ident) {
//         return table_ident[v - TOK_IDENT]->str;
        return leave(ri32(table_ident+4*(v - TOK_IDENT))+TokenSym_str_o);
//     } else {
    } else {
err();
//         /* should never happen */
//         return NULL;
//     }
    }
// }
err();
   return leave(0);
}
// 
// /* push, without hashing */
// Sym *sym_push2(Sym **ps, int v, int t, int c)
// {
function sym_push2(ps, v, t, c) {
    enter();
//     Sym *s;
    var s=alloca(4);
//     s = malloc(sizeof(Sym));
    wi32(s, malloc(Sym_size));
//     if (!s)
    if (!ri32(s)){
//         error("memory full");
        error("memory full");
    }
//     s->v = v;
    wi32(ri32(s)+Sym_v_o, v);
//     s->t = t;
    wi32(ri32(s)+Sym_t_o, t);
//     s->c = c;
    wi32(ri32(s)+Sym_c_o, c);
//     s->next = NULL;
    wi32(ri32(s)+Sym_next_o, 0);
//     /* add in stack */
//     s->prev = *ps;
// FIXME ljw is this right?
    wi32(ri32(s)+Sym_prev_o, ri32(ps));
//     *ps = s;
    wi32(ps,ri32(s));
//     return s;
    return leave(ri32(s));
// }
}
// 
// /* find a symbol and return its associated structure. 's' is the top
//    of the symbol stack */
// Sym *sym_find2(Sym *s, int v)
// {
function sym_find2(s, v) {
//     while (s) {
    while (s) {
//         if (s->v == v)
        if (ri32(s+Sym_v_o) == v)
//             return s;
            return s;
//         s = s->prev;
        s = ri32(s+Sym_prev_o);
//     }
    }
//     return NULL;
    return NULL;
// }
}
// 
// unsigned int HASH_SYM(int v) {
function HASH_SYM(v) {
//     return ((unsigned)(v) % SYM_HASH_SIZE);
    return (unsigned(v) % SYM_HASH_SIZE);
// }
}
// 
// /* find a symbol and return its associated structure. 'st' is the
//    symbol stack */
// Sym *sym_find1(SymStack *st, int v)
// {
function sym_find1(st, v) {
print("sym_find1: "+v);
//     Sym *s;
    var s;
// 
//     s = st->hash[HASH_SYM(v)];
var h=HASH_SYM(v);
print("sym_find1 hash: "+h);
    s = ri32(st+SymStack_hash_o+(4*h));
//     while (s) {
print("s: "+s);
     while (s) {
//         if (s->v == v)
         if (ri32(s+Sym_v_o) === v) {
//             return s;
             return s;
         }
//         s = s->hash_next;
         s = ri32(s+Sym_hash_next_o);
//     }
     }
//     return 0;
     return 0;
// }
}
// 
// Sym *sym_push1(SymStack *st, int v, int t, int c)
// {
function sym_push1(st, v, t, c) {
print("sym_push1: v: "+v+" t: "+t+" c: "+c);
    enter();
//     Sym *s, **ps;
    var s;
    var ps;
//     s = sym_push2(&st->top, v, t, c);
    s = sym_push2(st+SymStack_top_o, v, t, c);
//     /* add in hash table */
//     if (v) {
    if (v) {
//         ps = &st->hash[HASH_SYM(v)];
        ps = st+SymStack_hash_o+4*(HASH_SYM(v));
//         s->hash_next = *ps;
        wi32(s+Sym_hash_next_o, ri32(ps));
//         *ps = s;
        wi32(ps,s);
//     }
    }
//     return s;
print("sym_push1: "+JSON.stringify(decode_Sym(s)));
    return leave(s);
// }
}
// 
// /* find a symbol in the right symbol space */
// Sym *sym_find(int v)
// {
function sym_find(v) {
//     Sym *s;
    var s;
//     s = sym_find1(&local_stack, v);
    s = sym_find1(local_stack, v);
//     if (!s)
    if (!s) {
//         s = sym_find1(&global_stack, v);
        s = sym_find1(global_stack, v);
    }
//     return s;
    return s;
// }
}
// 
// /* push a given symbol on the symbol stack */
// Sym *sym_push(int v, int t, int c)
// {
function sym_push(v, t, c) {
//     if (local_stack.top)
    if (ri32(local_stack+SymStack_top_o)){
//         return sym_push1(&local_stack, v, t, c);
        return sym_push1(local_stack, v, t, c);
//     else
    } else {
//         return sym_push1(&global_stack, v, t, c);
        return sym_push1(global_stack, v, t, c);
    }
// }
}
// 
// /* pop symbols until top reaches 'b' */
// void sym_pop(SymStack *st, Sym *b)
// {
function sym_pop(st, b) {
//     Sym *s, *ss;
    var s;
    var ss;
// 
//     s = st->top;
    s = ri32(st+SymStack_top_o);
//     while(s != b) {
    while(s !== b) {
//         ss = s->prev;
        ss = ri32(s+Sym_prev_o);
//         /* free hash table entry, except if symbol was freed (only
//            used for #undef symbols) */
//         if (s->v)
        if (ri32(s+Sym_v_o)){
//             st->hash[HASH_SYM(s->v)] = s->hash_next;
            wi32(st+SymStack_hash_o+4*(HASH_SYM(ri32(s+Sym_v_o))), ri32(s+Sym_hash_next_o));
        }
//         free(s);
        free(s);
//         s = ss;
        s = ss;
//     }
    }
//     st->top = b;
    wi32(st+SymStack_top_o, b);
// }
}
// 
// /* undefined a hashed symbol (used for #undef). Its name is set to
//    zero */
// void sym_undef(SymStack *st, Sym *s)
// {
//     Sym **ss;
//     ss = &st->hash[HASH_SYM(s->v)];
//     while (*ss != NULL) {
//         if (*ss == s)
//             break;
//         ss = &(*ss)->hash_next;
//     }
//     *ss = s->hash_next;
//     s->v = 0;
// }
// 
// /* no need to put that inline */
// int handle_eof(void)
// {
function handle_eof() {
//     if (include_stack_ptr == include_stack)
    if (include_stack_ptr == include_stack) {
//         return -1;
        return -1;
    }
//     /* pop include stack */
//     fclose(file);
    fclose(file);
//     free(filename);
    free(filename);
//     include_stack_ptr--;
    include_stack_ptr=include_stack_ptr-IncludeFile_size;
//     file = include_stack_ptr->file;
    file = ri32(include_stack_ptr+IncludeFile_file_o);
//     filename = include_stack_ptr->filename;
    filename = ri32(include_stack_ptr+IncludeFile_filename_o);
//     line_num = include_stack_ptr->line_num;
    line_num = ri32(include_stack_ptr+IncludeFile_line_num_o);
//     return 0;
    return 0;
// }
}
// 
// /* read next char from current input file */
// static inline void inp(void)
// {
function inp(){
//     int redo=1;
    var redo=1;
//     while(redo){
    while(redo){
//         redo=0;
        redo=0;
//         /* faster than fgetc */
//         ch1 = getc_unlocked(file);
        ch1 = getc_unlocked(file);
//         if (ch1 == -1) {
        if (ch1 == -1) {
//             if (handle_eof() < 0)
            if (handle_eof() < 0)
//                 return;
                return;
//             else
            else
//                 redo=1;
                redo=1;
//         }
        }
//     }
    }
//     printf("%c",ch1);
    print(String.fromCharCode(ch1));
//     if (ch1 == '\n')
    if (ch1 === mk_char('\n')){
//         line_num++;
        line_num++;
    }
//     //    printf("ch1=%c 0x%x\n", ch1, ch1);
// }
}
// 
// /* input with '\\n' handling */
// static inline void minp(void)
// {
function minp() {
//     int redo=1;
    var redo=1;
//     while(redo){
    while(redo){
//         redo=0;
        redo=0;
//         ch = ch1;
        ch = ch1;
//         inp();
        inp();
//         if (ch == '\\' && ch1 == '\n') {
        if (ch == mk_char('\\') && ch1 == mk_char('\n')) {
//             inp();
            inp();
//             redo=1;
            redo=1;
//         }
        }
//     }
    }
//     //printf("ch=%c 0x%x\n", ch, ch);
// }
}
// 
// 
// /* same as minp, but also skip comments */
// void cinp(void)
// {
function cinp() {
    var c;

    if (ch1 == mk_char('/')) {
        inp();
        if (ch1 == mk_char('/')) {
            /* single line C++ comments */
            inp();
            while (ch1 != mk_char('\n') && ch1 != -1)
                inp();
            inp();
            ch = mk_char(' '); /* return space */
        } else if (ch1 == mk_char('*')) {
            /* C comments */
            inp();
            while (ch1 != -1) {
                c = ch1;
                inp();
            if (c == mk_char('*') && ch1 == mk_char('/')) {
                inp();
                ch = mk_char(' '); /* return space */
                break;
            }
            }
        } else {
//             ch = '/';
            ch = mk_char('/');
        }
    } else {
        minp();
    }
}
// 
// void skip_spaces(void)
// {
function skip_spaces() {

//     while (ch == ' ' || ch == '\t')
    while (ch == mk_char(' ') || ch == mk_char('\t'))
//         cinp();
         cinp();
// }
}
// 
// /* return the number of additionnal 'ints' necessary to store the
//    token */
// static inline int tok_ext_size(int t)
// {
function tok_ext_size(t) {
//     switch(t) {
    switch(t) {
//         /* 4 bytes */
//     case TOK_NUM:
    case TOK_NUM:
//     case TOK_CCHAR:
    case TOK_CCHAR:
//     case TOK_LCHAR:
    case TOK_LCHAR:
//     case TOK_STR:
    case TOK_STR:
//     case TOK_LSTR:
    case TOK_LSTR:
//     case TOK_CFLOAT:
    case TOK_CFLOAT:
//         return 1;
        return 1;
//     case TOK_CDOUBLE:
    case TOK_CDOUBLE:
//         return 2;
        return 2;
//     default:
    default:
//         return 0;
        return 0;
//     }
    }
// }
}
// 
// void tok_add(int **tok_str, int *tok_len, int t)
// {
function tok_add(tok_str, tok_len, t) {
    enter();
//     int len, *str;
    var len;
    var str=alloca(4);
//     len = *tok_len;
    len=ri32(tok_len);
//     str = *tok_str;
    wi32(str, ri32(tok_str));
//     if ((len & 63) == 0) {
    if ((len & 63) == 0) {
//         str = realloc(str, (len + 64) * sizeof(int));
        wi32(str, realloc(ri32(str), (len + 64) * 4));
//         if (!str)
        if (!ri32(str)) {
//             return;
            return leave();
        }
//         *tok_str = str;
        wi32(tok_str, ri32(str));
//     }
    }
//     str[len++] = t;
    wi32(ri32(str)+((len++)*4), t);
//     *tok_len = len;
    wi32(tok_len, len);
// }
    return leave();
}
// 
// void tok_add2(int **tok_str, int *tok_len, int t, CValue *cv)
// {
function tok_add2(tok_str, tok_len, t, cv) {
    enter();
//     int n, i;
    var n;
    var i;
// 
//     tok_add(tok_str, tok_len, t);
    tok_add(tok_str, tok_len, t);
//     n = tok_ext_size(t);
    n = tok_ext_size(t);
//     for(i=0;i<n;i++)
    for(i=0;i<n;i++) {
//         tok_add(tok_str, tok_len, cv->tab[i]);
        tok_add(tok_str, tok_len, ri32(cv+(i*4)));
    }
// }
    return leave();
}
// 
// /* get a token from an integer array and increment pointer accordingly */
// int tok_get(int **tok_str, CValue *cv)
// {
function tok_get(tok_str, cv) {
//     int *p, t, n, i;
     var p;
     var t;
     var n;
     var i;
// 
//     p = *tok_str;
    p = ri32(tok_str);
//     t = *p++;
    t = ri32(p);
    p=p+4;
//     n = tok_ext_size(t);
    n = tok_ext_size(t);
//     for(i=0;i<n;i++)
    for(i=0;i<n;i++) {
//         cv->tab[i] = *p++;
        wi32(cv+(i*4),ri32(p));
        p=p+4;
    }
//     *tok_str = p;
    wi32(tok_str, p);
//     return t;
    return t;
// }
}
// 
// /* XXX: should be more factorized */
// void define_symbol(char *sym)
// {
function define_symbol(sym) {
    enter();
//     TokenSym *ts;
    var ts;
//     int *str, len;
    var str=alloca(4);
    var len=alloca(4);
//     CValue cval;
    var cval=alloca(CValue_size);
// 
//     ts = tok_alloc(sym, 0);
    ts = tok_alloc(sym, 0);
//     str = NULL;
    wi32(str,0);
//     len = 0;
    wi32(len,0);
//     cval.i = 1;
    wi32(cval,1);
//     tok_add2(&str, &len, TOK_NUM, &cval);
    tok_add2(str, len, TOK_NUM, cval);
//     tok_add(&str, &len, 0);
    tok_add(str, len, 0);
//     sym_push1(&define_stack, ts->tok, MACRO_OBJ, (int)str);
    sym_push1(define_stack, ri32(ts+TokenSym_tok_o), MACRO_OBJ, ri32(str));
// }
    return leave();
}
// 
// void preprocess(void)
// {
function preprocess() {
//     int size, i, c, v, t, *str, len;
    var size;
    var i;
    var c;
    var v;
    var t;
    var str=alloca(4);
    var len=alloca(4);
//     int found=0;
    var found=0;
//     char buf[1024], *q, *p;
    var buf_size=1024;
    var buf=alloca(buf_size);
    var q;
    var p;
//     char buf1[1024];
    var buf1=alloca(buf_size);
//     FILE *f;
    var f;
//     Sym **ps, *first, *s;
    var ps;
    var first;
    var s;
// 
//     cinp();
    cinp();
//     next_nomacro();
    next_nomacro();
//     if (tok == TOK_DEFINE) {
    if (tok == TOK_DEFINE) {
//         next_nomacro();
        next_nomacro();
//         v = tok;
        v = tok;
//         /* XXX: should check if same macro (ANSI) */
//         first = NULL;
        first = NULL;
//         t = MACRO_OBJ;
        t = MACRO_OBJ;
//         str = NULL;
        wi32(str, NULL);
//         len = 0;
        wi32(len, 0);
//         while (1) {
        while (1) {
//             skip_spaces();
            skip_spaces();
//             if (ch == '\n' || ch == -1)
            if (ch == mk_char('\n') || ch == -1)
//                 break;
                break;
//             next_nomacro();
            next_nomacro();
//             tok_add2(&str, &len, tok, &tokc);
            tok_add2(str, len, tok, tokc);
//         }
        }
//         tok_add(&str, &len, 0);
        tok_add(str, len, 0);
//         s = sym_push1(&define_stack, v, t, (int)str);
        s = sym_push1(define_stack, v, t, ri32(str));
//         s->next = first;
        wi32(s+Sym_next_o,first);
//     } else if (tok == TOK_UNDEF) {
    } else if (tok == TOK_UNDEF) {
err();
//         next_nomacro();
//         s = sym_find1(&define_stack, tok);
//         /* undefine symbol by putting an invalid name */
//         if (s)
//             sym_undef(&define_stack, s);
//     } else if (tok == TOK_INCLUDE) {
    } else if (tok == TOK_INCLUDE) {
//         skip_spaces();
        skip_spaces();
//         if ((ch == '<') || (ch == '\"')) {
        if ((ch == mk_char('<')) || (ch == mk_char('\"'))) {
//             c = mk_char('>');
            c = mk_char('>');
//         if (ch == '\"')
        if (ch == mk_char('\"'))
//             c = ch;
            c = ch;
//             minp();
            minp();
//             q = buf;
            q = buf;
//             while (ch != c && ch != '\n' && ch != -1) {
            while (ch != c && ch != mk_char('\n') && ch != -1) {
//                 if ((q - buf) < sizeof(buf) - 1)
                if ((q - buf) < buf_size - 1)
//                     *q++ = ch;
                    wi8(q++, ch);
//                 minp();
                minp();
//             }
            }
//             *q = '\0';
            wi8(q, 0);
//         } else {
        } else {
err();
//             next();
            next();
//             if (tok != TOK_STR)
            if (tok != TOK_STR)
//                 error("#include syntax error");
                error("#include syntax error");
//             /* XXX: buffer overflow */
//             strcpy(buf, get_tok_str(tok, &tokc));
            strcpy(buf, get_tok_str(tok, tokc));
//             c = '\"';
            c = mk_char('\"');
//         }
        }
//         /* eat all spaces and comments after include */
//         /* XXX: slightly incorrect */
//         while (ch1 != '\n' && ch1 != -1)
        while (ch1 != mk_char('\n') && ch1 != -1)
//             inp();
            inp();
// 
//         if (include_stack_ptr >= include_stack + INCLUDE_STACK_SIZE)
        if (include_stack_ptr >= include_stack + INCLUDE_STACK_SIZE)
//             error("memory full");
            error("memory full");
//         if (c == '\"') {
        if (c == mk_char('\"')) {
//             /* first search in current dir if "header.h" */
//             /* XXX: buffer overflow */
//             size = 0;
            size = 0;
//             p = strrchr(filename, '/');
            p = strrchr(filename, mk_char('/'));
//             if (p) 
            if (p) 
//                 size = p + 1 - filename;
                size = p + 1 - filename;
//             memcpy(buf1, filename, size);
            memcpy(buf1, filename, size);
//             buf1[size] = '\0';
            wi8(buf1+size, 0);
//             strcat(buf1, buf);
            strcat(buf1, buf);
print("buf1: "+mk_js_string(buf1)+" buf: "+mk_js_string(buf));
//             f = fopen(buf1, "r");
            f = fopen(buf1, mk_c_string("r"));
//             if (f)
            if (f)
//                 found=1;
                found=1;
//         }
        }
//         /* now search in standard include path */
//         if(!found){
        if(!found){
//             for(i=nb_include_paths - 1;i>=0;i--) {
            for(i=nb_include_paths - 1;i>=0;i--) {
//                 strcpy(buf1, include_paths[i]);
                strcpy(buf1, ri32(include_paths+(4*i)));
//                 strcat(buf1, "/");
                strcat(buf1, mk_char("/"));
//                 strcat(buf1, buf);
                strcat(buf1, buf);
//                 f = fopen(buf1, "r");
                f = fopen(buf1, mk_c_string("r"));
//                 if (f)
                if (f)
//                     found=1;
                    found=1;
//             }
            }
//         }
        }
//         if(!found){
        if(!found){
//             error("include file '%s' not found", buf1);
            print("include file "+mk_js_string(buf1)+" not found");
err();
//             f = NULL;
//         }
        }
//         /* push current file in stack */
//         /* XXX: fix current line init */
//         include_stack_ptr->file = file;
        wi32(include_stack_ptr+ IncludeFile_file_o, file);
//         include_stack_ptr->filename = filename;
        wi32(include_stack_ptr+IncludeFile_filename_o, filename);
//         include_stack_ptr->line_num = line_num;
        wi32(include_stack_ptr+IncludeFile_line_num_o, line_num);
//         include_stack_ptr++;
        include_stack_ptr = include_stack_ptr+IncludeFile_size;
//         file = f;
        file = f;
//         filename = strdup(buf1);
        filename = strdup(buf1);
print("filename: "+mk_js_string(filename));
//         line_num = 1;
        line_num = 1;
//     }
    }
//     if (tok == TOK_ERROR) {
    if (tok == TOK_ERROR) {
err();
//         error("#error");
//     }
    }
//     /* ignore other preprocess commands or #! for C scripts */
//     while (ch != '\n' && ch != -1)
    while (ch != mk_char('\n') && ch != -1)
//         cinp();
        cinp();
// }
}
// 
// /* read a number in base b */
// int getn(b)
// {
//     int n, t;
//     n = 0;
//     while (1) {
//         if (ch >= 'a' & ch <= 'f')
//             t = ch - 'a' + 10;
//         else if (ch >= 'A' & ch <= 'F')
//             t = ch - 'A' + 10;
//         else if (isnum(ch))
//             t = ch - '0';
//         else
//             break;
//         if (t < 0 | t >= b)
//             break;
//         n = n * b + t;
//         cinp();
//     }
//     return n;
// }
// 
// /* read a character for string or char constant and eval escape codes */
// int getq()
// {
function getq() {
//     int c;
    var c;
// 
//     c = ch;
    c = ch;
//     minp();
    minp();
//     if (c == '\\') {
    if (c == mk_char('\\')) {
//         if (isnum(ch)) {
        if (isnum(ch)) {
//             /* at most three octal digits */
//             c = ch - '0';
            c = ch - mk_char('0');
//             minp();
            minp();
//             if (isnum(ch)) {
            if (isnum(ch)) {
//                 c = c * 8 + ch - '0';
                c = c * 8 + ch - mk_char('0');
//                 minp();
                minp();
//                 if (isnum(ch)) {
                if (isnum(ch)) {
//                     c = c * 8 + ch - '0';
                    c = c * 8 + ch - mk_char('0');
//                     minp();
                    minp();
//                 }
                }
//             }
            }
//             return c;
            return c;
//         } else if (ch == 'x') {
        } else if (ch == mk_char('x')) {
err();
//             minp();
//             return getn(16);
//         } else {
        } else {
            if (ch == mk_char('a'))
                c = mk_char('\a');
            else if (ch == mk_char('b'))
                c = mk_char('\b');
            else if (ch == mk_char('f'))
                c = mk_char('\f');
            else if (ch == mk_char('n'))
                c = mk_char('\n');
            else if (ch == mk_char('r'))
                c = mk_char('\r');
            else if (ch == mk_char('t'))
                c = mk_char('\t');
            else if (ch == mk_char('v'))
                c = mk_char('\v');
            else if (ch == mk_char('e') && gnu_ext)
                c = 27;
            else if (ch == mk_char('\'') || ch == mk_char('\"') || ch == mk_char('\\') || ch == mk_char('?'))
                c = ch;
            else
                error("invalid escaped char");
            minp();
        }
//     }
    }
//     return c;
    return c;
// }
}
// 
// void parse_number(void)
// {
function parse_number() {
//     int b, t, shift, frac_bits, s, exp_val;
    var b;
    var t;
    var shift;
    var frac_bits;
    var s;
    var exp_val;
//     char *q;
    var q;
//     unsigned int n, n1;
    var n;
    var n1;
// 
//     /* number */
//     q = token_buf;
    q = token_buf;
//     t = ch;
    t = ch;
//     cinp();
    cinp();
//     *q++ = t;
    wi8(q++, t);
//     b = 10;
    b = 10;
//     if (t == '.') {
    if (t === mk_char('.')) {
        /* special dot handling */
        if (ch == mk_char('.')) {
            cinp();
            if (ch != mk_char('.'))
                expect("'.'");
            cinp();
            tok = TOK_DOTS;
        } else {
            /* dots */
            tok = t;
        }
        return;
//     } else if (t == '0') {
    } else if (t === mk_char('0')) {
//         if (ch == 'x' || ch == 'X') {
        if (ch == mk_char('x') || ch == mk_char('X')) {
//             q--;
            q--;
//             cinp();
            cinp();
//             b = 16;
            b = 16;
//         } else if (tcc_ext && (ch == 'b' || ch == 'B')) {
        } else if (tcc_ext && (ch == 'b' || ch == 'B')) {
err();
//             q--;
//             cinp();
//             b = 2;
//         }
        }
//     }
    }
//     /* parse all digits. cannot check octal numbers at this stage
//        because of floating point constants */
//     while (1) {
    while (1) {
//         if (ch >= 'a' & ch <= 'f')
        if (ch >= mk_char('a') & ch <= mk_char('f'))
//             t = ch - 'a' + 10;
            t = ch - mk_char('a') + 10;
//         else if (ch >= 'A' & ch <= 'F')
        else if (ch >= mk_char('A') & ch <= mk_char('F'))
//             t = ch - 'A' + 10;
            t = ch - mk_char('A') + 10;
//         else if (isnum(ch))
        else if (isnum(ch))
//             t = ch - '0';
            t = ch - mk_char('0');
//         else
        else
//             break;
            break;
//         if (t >= b)
        if (t >= b)
//             break;
            break;
//         if (q >= token_buf + STRING_MAX_SIZE) {
        if (q >= token_buf + STRING_MAX_SIZE) {
//             error("number too long");
            error("number too long");
//         }
        }
//         *q++ = ch;
        wi8(q++, ch);
//         cinp();
        cinp();
//     }
    }
//     /* integer number */
//     *q = '\0';
    wi8(q, mk_char('\0'));
//     q = token_buf;
    q = token_buf;
//     if (b == 10 && *q == '0') {
    if (b === 10 && ri8(q) === mk_char('0')) {
//         b = 8;
        b = 8;
//         q++;
        q++;
//     }
    }
//     n = 0;
    n = 0;
//     while(1) {
    while(1) {
//         t = *q++;
        t = ri8(q++);
//         /* no need for checks except for base 10 / 8 errors */
//         if (t == '\0') {
        if (t === mk_char('\0')) {
//             break;
            break;
//         } else if (t >= 'a') {
        } else if (t >= mk_char('a')) {
//             t = t - 'a' + 10;
            t = t - mk_char('a') + 10;
//         } else if (t >= 'A') {
        } else if (t >= mk_char('A')) {
//             t = t - 'A' + 10;
            t = t - mk_char('A') + 10;
//         } else {
        } else {
//             t = t - '0';
            t = t -  mk_char('0');
//             if (t >= b)
            if (t >= b)
//                 error("invalid digit");
                error("invalid digit");
//         }
        }
//         n1 = n;
        n1 = unsigned(n);
//         n = n * b + t;
        n = unsigned(n) * b + t;
//         /* detect overflow */
        /* detect overflow */
//         if (n < n1)
        if (n < n1)
//             error("integer constant overflow");
            error("integer constant overflow");
//     }
    }
//     tokc.ui = n;
    wi32(tokc, n);
//     tok = TOK_NUM;
    tok = TOK_NUM;
//     /* XXX: add unsigned constant support (ANSI) */
//     while (ch == 'L' || ch == 'l' || ch == 'U' || ch == 'u')
    while (ch === mk_char('L') || ch === mk_char('l') || ch === mk_char('U') || ch === mk_char('u'))
//         cinp();
        cinp();
// }
}
// 
// 
// /* return next token without macro substitution */
// void next_nomacro1(void)
// {
function next_nomacro1() {
    enter();
//     int b;
    var b;
//     char *q;
    var q;
//     TokenSym *ts;
    var ts;
// 
//     /* skip spaces */
//     while(1) {
    while(1) {
//         while (ch == '\n') {
        while (ch == mk_char('\n')) {
//             cinp();
            cinp();
//             while (ch == ' ' || ch == 9)
            while (ch == mk_char(' ') || ch == 9) {
//                 cinp();
                cinp();
            }
//             if (ch == '#') {
            if (ch == mk_char('#')) {
//                 /* preprocessor command if # at start of line after
//                    spaces */
//                 preprocess();
                preprocess();
//             }
            }
//         }
        }
//         if (ch != ' ' && ch != '\t' && ch != '\f')
        if (ch != mk_char(' ') && ch != mk_char('\t') && ch != mk_char('\f')) {
//             break;
            break;
        }
//         cinp();
        cinp();
//     }
    }
//     if (isid(ch)) {
    if (isid(ch)) {
//         q = token_buf;
        q = token_buf;
//         *q++ = ch;
        wi8(q++, ch);
//         cinp();
        cinp();
//         while (isid(ch) || isnum(ch)) {
        while (isid(ch) || isnum(ch)) {
//             if (q >= token_buf + STRING_MAX_SIZE)
            if (q >= token_buf + STRING_MAX_SIZE) {
//                 error("ident too long");
                error("ident too long");
            }
//             *q++ = ch;
               wi8(q++, ch);
//             cinp();
            cinp();
//         }
        }
//         *q = '\0';
        wi8(q, 0);
//         ts = tok_alloc(token_buf, q - token_buf);
        ts = tok_alloc(token_buf, q - token_buf);
//         tok = ts->tok;
         tok = ri32(ts+TokenSym_tok_o);
//     } else if (isnum(ch) || ch == '.') {
    } else if (isnum(ch) || ch == mk_char('.')) {
//         parse_number();
        parse_number();
//     } else if (ch == '\'') {
     } else if (ch == mk_char('\'')) {
//         tok = TOK_CCHAR;
        tok = TOK_CCHAR;
//         minp();
        minp();
//         tokc.i = getq();
        wi32(tokc, getq());
//         if (ch != '\'')
        if (ch != mk_char('\''))
//             expect("\'");
            expect("\'");
//         minp();
        minp();
//     } else if (ch == '\"') {
    } else if (ch == mk_char('\"')) {
//         tok = TOK_STR;
        tok = TOK_STR;
//         minp();
        minp();
//         q = token_buf;
        q = token_buf;
//         while (ch != '\"') {
        while (ch !== mk_char('\"')) {
//             b = getq();
            b = getq();
//             if (ch == -1)
            if (ch == -1)
//                 error("unterminated string");
                error("unterminated string");
//             if (q >= token_buf + STRING_MAX_SIZE)
            if (q >= token_buf + STRING_MAX_SIZE)
//                 error("string too long");
                error("string too long");
//             *q++ = b;
            wi8(q++, b);
//         }
        }
//         *q = '\0';
        wi8(q, 0);
//         tokc.ts = tok_alloc(token_buf, q - token_buf);
        wi32(tokc, tok_alloc(token_buf, q - token_buf));
//         minp();
        minp();
//     } else {
    } else {
//         q = "<=\236>=\235!=\225&&\240||\241++\244--\242==\224<<\1>>\2+=\253-=\255*=\252/=\257%=\245&=\246^=\336|=\374->\247..\250##\266";
        q = mk_c_string("<=\236>=\235!=\225&&\240||\241++\244--\242==\224<<\1>>\2+=\253-=\255*=\252/=\257%=\245&=\246^=\336|=\374->\247..\250##\266");
//         /* two chars */
//         tok = ch;
        tok = ch;
//         cinp();
        cinp();
//         while (*q) {
        while (ri8(q)) {
//             if (*q == tok && q[1] == ch) {
            if (ri8(q) === tok && ri8(q+1) === ch) {
//                 cinp();
                cinp();
//                 tok = q[2] & 0xff;
                tok = ri8(q+2) & 0xff;
//                 /* three chars tests */
//                 if (tok == TOK_SHL | tok == TOK_SAR) {
                if (tok == TOK_SHL | tok == TOK_SAR) {
//                     if (ch == '=') {
                    if (ch == mk_char('=')) {
//                         tok = tok | 0x80;
                        tok = tok | 0x80;
//                         cinp();
                        cinp();
//                     }
                    }
//                 } else if (tok == TOK_DOTS) {
                } else if (tok == TOK_DOTS) {
err();
//                     if (ch != '.')
//                         error("parse error");
//                     cinp();
//                 }
                }
//                 return;
                return leave();
//             }
            }
//             q = q + 3;
            q = q + 3;
//         }
        }
//         /* single char substitutions */
//         if (tok == '<')
        if (tok === mk_char('<')){
//             tok = TOK_LT;
            tok = TOK_LT;
//         else if (tok == '>')
        } else if (tok == mk_char('>')) {
err();
//             tok = TOK_GT;
            tok = TOK_GT;
        }
//     }
    }
// }
    leave();
}
// 
// /* return next token without macro substitution. Can read input from
//    macro_ptr buffer */
// void next_nomacro()
// {
function next_nomacro() {
    enter();
//     if (macro_ptr) {
    if (ri32(macro_ptr)) {
//         tok = *macro_ptr;
        tok = ri32(ri32(macro_ptr));
//         if (tok)
        if (tok)
//             tok = tok_get(&macro_ptr, &tokc);
            tok = tok_get(macro_ptr, tokc);
//     } else {
    } else {
//         next_nomacro1();
        next_nomacro1();
//     }
    }
// }
    leave();
}
// 
// /* substitute args in macro_str and return allocated string */
// int *macro_arg_subst(Sym **nested_list, int *macro_str, Sym *args)
// {
//     int *st, last_tok, t, notfirst, *str, len;
//     Sym *s;
//     TokenSym *ts;
//     CValue cval;
// 
//     str = NULL;
//     len = 0;
//     last_tok = 0;
//     while(1) {
//         t = tok_get(&macro_str, &cval);
//         if (!t)
//             break;
//         if (t == '#') {
//             /* stringize */
//             t = tok_get(&macro_str, &cval);
//             if (!t)
//                 break;
//             s = sym_find2(args, t);
//             if (s) {
//                 token_buf[0] = '\0';
//                 st = (int *)s->c;
//                 /* XXX: buffer overflow */
//                 notfirst = 0;
//                 while (*st) {
//                     if (notfirst)
//                         strcat(token_buf, " ");
//                     t = tok_get(&st, &cval);
//                     strcat(token_buf, get_tok_str(t, &cval));
//                     notfirst = 1;
//                 }
//                 /* add string */
//                 ts = tok_alloc(token_buf, 0);
//                 cval.ts = ts;
//                 tok_add2(&str, &len, TOK_STR, &cval);
//             } else {
//                 tok_add2(&str, &len, t, &cval);
//             }
//         } else if (t >= TOK_IDENT) {
//             s = sym_find2(args, t);
//             if (s) {
//                 st = (int *)s->c;
//                 /* if '##' is present before or after , no arg substitution */
//                 if (*macro_str == TOK_TWOSHARPS || last_tok == TOK_TWOSHARPS) {
//                     while (*st)
//                         tok_add(&str, &len, *st++);
//                 } else {
//                     macro_subst(&str, &len, nested_list, st);
//                 }
//             } else {
//                 tok_add(&str, &len, t);
//             }
//         } else {
//             tok_add2(&str, &len, t, &cval);
//         }
//         last_tok = t;
//     }
//     tok_add(&str, &len, 0);
//     return str;
// }
// 
// /* handle the '##' operator LJW HACK DELETED CODE*/
// int *macro_twosharps(int *macro_str)
// {
function macro_twosharps(macro_str) {
enter();
//     TokenSym *ts;
    var ts;
//     int *macro_str1, macro_str1_len, *macro_ptr1;
    var macro_str1=alloca(4);
    var macro_str1_len=alloca(4);
    var macro_ptr1=alloca(4);
//     int t;
    var t;
//     char *p;
    var p;
//     CValue cval;
    var cval;
// 
//     macro_str1 = NULL;
    wi32(macro_str1, NULL);
//     macro_str1_len = 0;
    wi32(macro_str1_len, 0);
//     tok = 0;
    tok = 0;
//     while (1) {
    while (1) {
//         next_nomacro();
        next_nomacro();
//         if (tok == 0)
        if (tok == 0)
//             break;
            break;
//         tok_add2(&macro_str1, &macro_str1_len, tok, &tokc);
        tok_add2(macro_str1, macro_str1_len, tok, tokc);
//     }
    }
//     tok_add(&macro_str1, &macro_str1_len, 0);
    tok_add(macro_str1, macro_str1_len, 0);
//     return macro_str1;
    return leave(ri32(macro_str1));
// }
}
// 
// 
// 
// /* do macro substitution of macro_str and add result to
//    (tok_str,tok_len). If macro_str is NULL, then input stream token is
//    substituted. 'nested_list' is the list of all macros we got inside
//    to avoid recursing. */
// void macro_subst(int **tok_str, int *tok_len, 
//                  Sym **nested_list, int *macro_str)
// {
function macro_subst(tok_str, tok_len, nested_list, macro_str) {
    enter();
//     Sym *s, *args, *sa, *sa1;
    var s=alloca(4);
    var args=alloca(4);
    var sa=alloca(4);
    var sa1=alloca(4);
//     int *str, parlevel, len, *mstr, t, *saved_macro_ptr;
    var str=alloca(4);
    var parlevel=alloca(4);
    var len=alloca(4);
    var mstr=alloca(4);
    var t=alloca(4);
    var saved_macro_ptr;
//     int mstr_allocated, *macro_str1;
    var mstr_allocated=alloca(4);
    var macro_str1;
//     int no_subst;
    var no_subst;
//     CValue cval;
    var cval=alloca(CValue_size);
// 
//     saved_macro_ptr = macro_ptr;
    saved_macro_ptr = ri32(macro_ptr);
//     macro_ptr = macro_str;
    wi32(macro_ptr, macro_str);
//     macro_str1 = NULL;
    macro_str1 = NULL;
//     if (macro_str) {
    if (macro_str) {
//         /* first scan for '##' operator handling */
//         macro_str1 = macro_twosharps(macro_str);
        macro_str1 = macro_twosharps(macro_str);
//         macro_ptr = macro_str1;
        wi32(macro_ptr, macro_str1);
//     }
    }
// 
    while (1) {
        no_subst=0;
        next_nomacro();
         if (tok == 0) {
             break;
         }
         if ((s = sym_find1(define_stack, tok)) !== NULL) {
//             /* if symbol is a macro, prepare substitution */
//             /* if nested substitution, do nothing */
            if (sym_find2(ri32(nested_list), tok)) {
err();
//                 no_subst=1;
                no_subst=1;
            }
            if(no_subst==0){
// FIXME ljw might not be right
                mstr = ri32(s+Sym_c_o);
                mstr_allocated = 0;
                sym_push2(nested_list, ri32(s+Sym_v_o), 0, 0);
                macro_subst(tok_str, tok_len, nested_list, mstr);
//                 /* pop nested defined symbol */
                sa1 = ri32(nested_list);
                wi32(nested_list, ri32(sa1+Sym_prev_o));
                free(sa1);
                if (mstr_allocated)
                free(mstr);
            }
         } else {
             no_subst=1;
         }
         if (no_subst) {
//             /* no need to add if reading input stream */
             if (!macro_str) 
                 return leave();
             tok_add2(tok_str, tok_len, tok, tokc);
         }
//         /* only replace one macro while parsing input stream */
         if (!macro_str)
             return leave();
     }
    wi32(macro_ptr, saved_macro_ptr);
// FIXME ljw should free
//     if (macro_str1)
//         free(macro_str1);
// }
    leave();
}
// 
// /* return next token with macro substitution */
// void next(void)
// {
function next() {
    enter();
//     int len, *ptr;
    var len=alloca(4);
    var ptr=alloca(4);
//     int redo=1;
    var redo=1;
//     Sym *nested_list;
    var nested_list=alloca(4);
// 
//     /* special 'ungettok' case for label parsing */
//     if (tok1) {
    if (tok1) {
err();
//         tok = tok1;
//         tokc = tok1c;
//         tok1 = 0;
//     } else {
    } else {
//     while(redo){
    while(redo){
//         redo=0;
        redo=0;
//         if (!macro_ptr) {
        if (!ri32(macro_ptr)) {
//             /* if not reading from macro substuted string, then try to substitute */
//             len = 0;
            wi32(len, 0);
//             ptr = NULL;
            wi32(ptr, NULL);
//             nested_list = NULL;
            wi32(nested_list, NULL);
//             macro_subst(&ptr, &len, &nested_list, NULL);
            macro_subst(ptr, len, nested_list, NULL);
//             if (ptr) {
             if (ri32(ptr)) {
//                 tok_add(&ptr, &len, 0);
                tok_add(ptr, len, 0);
//                 macro_ptr = ptr;
                wi32(macro_ptr, ri32(ptr));
//                 macro_ptr_allocated = ptr;
                macro_ptr_allocated = ri32(ptr);
//                 redo=1;
                redo=1;
//                 continue;
                continue;
//             }
             }
//             if (tok == 0) {
             if (tok === 0) {
//                 redo=1;
                 redo=1;
//                 continue;
                 continue;
//              }
              }
//         } else {
        } else {
//             next_nomacro();
            next_nomacro();
//             if (tok == 0) {
            if (tok == 0) {
//                 /* end of macro string: free it */
//                 free(macro_ptr_allocated);
                free(macro_ptr_allocated);
//                 macro_ptr = NULL;
                wi32(macro_ptr, NULL);
//                 redo=1;
                redo=1;
//                 continue;
                continue;
//             }
            }
//         }
        }
//         break;
        break;
//     }
    }
//     }
    }
// }
    leave();
}
// 
// void swap(int *p, int *q)
// {
//     int t;
//     t = *p;
//     *p = *q;
//     *q = t;
// }
// 
// void vsetc(int t, CValue *vc)
// {
function vsetc(t, vc) {
//     if (vtop >= vstack + VSTACK_SIZE)
    if (vtop >= vstack + VSTACK_SIZE) {
//         error("memory full");
        error("memory full");
    }
//     /* cannot let cpu flags if other instruction are generated */
//     /* XXX: VT_JMP test too ? */
//     if ((vtop->t & VT_VALMASK) == VT_CMP)
    if ((ri32(vtop+SValue_t_o) & VT_VALMASK) == VT_CMP) {
err();
//         gv();
    }
//     vtop++;
    vtop=vtop+SValue_size;
//     vtop->t = t;
    wi32(vtop+SValue_t_o,t);
//     vtop->c = *vc;
//    vtop->c = *vc;
   memcpy(vtop+SValue_c_o, vc,CValue_size);
// }
}
// 
// void vset(int t, int v)
// {
function vset(t, v) {
print("t: "+t+" v: "+v);
    enter();
//     CValue cval;
    var cval=malloc(CValue_size);
// 
//     cval.i = v;
    wi32(cval, v);
//     vsetc(t, &cval);
    vsetc(t, cval);
    leave();
// }
}
// 
// void vswap(void)
// {
function vswap() {
    enter();
//     SValue tmp;
    var tmp=alloca(SValue_size);
// 
//     tmp = vtop[0];
    memcpy(tmp, vtop,SValue_size);
//     vtop[0] = vtop[-1];
    memcpy(vtop, vtop-SValue_size, SValue_size);
//     vtop[-1] = tmp;
    memcpy(vtop-SValue_size, tmp, SValue_size);
    leave();
// }
}
// 
// void vdup(void)
// {
function vdup() {
//     if (vtop >= vstack + VSTACK_SIZE)
    if (vtop >= vstack + VSTACK_SIZE)
//         error("memory full");
        error("memory full");
//     vtop++;
    vtop=vtop+SValue_size;
//     *vtop = vtop[-1];
    memcpy(vtop, vtop-SValue_size,SValue_size);
// }
}
// 
// int save_reg_forced(int r)
// {
function save_reg_forced(r) {
//     int i, l, t;
    var i;
    var l;
    var t;
//     SValue *p;
    var p;

    /* store register */
    loc = (loc - 4) & -3;
    store(r, VT_LOCAL, loc);
    l = loc;

    /* modify all stack values */
    for(p=vstack;p<=vtop;p=p+SValue_size) {
        i = ri32(p+SValue_t_o) & VT_VALMASK;
        if (i == r) {
            if (ri32(p+SValue_t_o) & VT_LVAL) {
                t = VT_LLOCAL;
            } else {
                t = VT_LOCAL;
            }
            wi32(p+SValue_t_o, (ri32(p+SValue_t_o) & VT_TYPE) | VT_LVAL | t);
            wi32(p+SValue_c_o, l);
        }
    }
    return l;
}
// 
// /* save r to memory. and mark it as being free */
// void save_reg(int r)
// {
function save_reg(r) {
    var i;
    var p;

    /* modify all stack values */
    for(p=vstack;p<=vtop;p=p+SValue_size) {
        i = ri32(p+SValue_t_o) & VT_VALMASK;
        if (i == r) {
            save_reg_forced(r);
            break;
        }
    }
}
// 
// /* find a free register of class 'rc'. If none, save one register */
// int get_reg(int rc)
// {
function get_reg(rc) {
    enter();
//     int r, i;
    var r;
    var i;
//     int notfound;
    var notfound;
//     SValue *p;
    var p=alloca(SValue_size);
// 
//     /* find a free register */
//     for(r=0;r<NB_REGS;r++) {
    for(r=0;r<NB_REGS;r++) {
//         notfound=0;
        notfound=0;
//         if (reg_classes[r] & rc) {
        if (ri32(reg_classes+(4*r)) & rc) {
//             for(p=vstack;p<=vtop;p++) {
            for(p=vstack;p<=vtop;p=p+SValue_size) {
//                i = p->t & VT_VALMASK;
                i = ri32(p+SValue_t_o) & VT_VALMASK;
//                 if (i == r)
                if (i == r)
//                     notfound=1;
                    notfound=1;
//             }
            }
//             if(!notfound){
            if(!notfound){
//             return r;
            return leave(r);
//             }
            }
//         }
        }
//     }
    }
//     
//     /* no register left : free the first one on the stack (very
//        important to start from the bottom to ensure that we don't
//        spill registers used in gen_op()) */
//     for(p=vstack;p<=vtop;p++) {
    for(p=vstack;p<=vtop;p+SValue_size) {
//         r = p->t & VT_VALMASK;
        r = ri32(p+SValue_t_o) & VT_VALMASK;
//         if (r < VT_CONST && (reg_classes[r] & rc)) {
        if (r < VT_CONST && (ri32(reg_classes+(4*r)) & rc)) {
//             save_reg(r);
            save_reg(r);
//             break;
            break;
//         }
        }
//     }
    }
//     return r;
// }
    return leave(r);
}
// 
// void save_regs()
// {
function save_regs() {
//     int r;
    var r;
//     SValue *p;
    var p;
// 
//     for(p=vstack;p<=vtop;p++) {
    for(p=vstack;p<=vtop;p=p+SValue_size) {
//         r = p->t & VT_VALMASK;
        r = ri32(p+SValue_t_o) & VT_VALMASK;
//         if (r < VT_CONST) {
        if (r < VT_CONST) {
//             save_reg(r);
            save_reg(r);
//         }
        }
//     }
    }
// }
}
// 
// /* move register 's' to 'r', and flush previous value of r to memory
//    if needed */
// void move_reg(int r, int s)
// {
function move_reg(r, s) {
    if (r != s) {
        save_reg(r);
        _load(r, s, 0);
    }
 }
// 
// /* convert a (vtop->t, vtop->c) in register. lvalues are converted as
//    values. Cannot be used if cannot be converted to register value
//    (such as structures). */
// int gv(void)
// {
function gv() {
//     int r, bit_pos, bit_size, rc, size, align, i;
    var r;
    var bit_pos;
    var bit_size;
    var rc;
    var size;
    var align;
    var i;
// 
//     /* NOTE: get_reg can modify vstack[] */
//     r = vtop->t & VT_VALMASK;
    r = ri32(vtop+SValue_t_o) & VT_VALMASK;
print("gv r_init: "+r)
//     if (r >= VT_CONST || (vtop->t & VT_LVAL)) {
    if (r >= VT_CONST || (ri32(vtop+SValue_t_o) & VT_LVAL)) {
//         rc = REG_CLASS_INT;
        rc = REG_CLASS_INT;
//         r = get_reg(rc);
        r = get_reg(rc);
//     }
    }
print("gv r_ret: "+r)
//     load(r, vtop->t, vtop->c.ul);
    _load(r, ri32(vtop+SValue_t_o), unsigned(ri32(vtop+SValue_c_o)));
//     vtop->t = (vtop->t & VT_TYPE) | r;
    wi32(vtop+SValue_t_o, (ri32(vtop+SValue_t_o) & VT_TYPE) | r);
//     return r;
    return r;
// }
}
// 
// /* handle constant optimizations and various machine independant opt */
// void gen_opc(int op)
// {
function gen_opc(op) {
print("gen_opc: "+op);
//     int fc, c1, c2, n;
    var fc;
    var c1;
    var c2;
    var n;
//     int general_case=0;
    var general_case=0;
//     SValue *v1, *v2;
    var v1;
    var v2;
    var tmp;
// 
//     v1 = vtop - 1;
    v1 = vtop - SValue_size;
//     v2 = vtop;
    v2 = vtop;
//     /* currently, we cannot do computations with forward symbols */
//     c1 = (v1->t & (VT_VALMASK | VT_LVAL | VT_FORWARD)) == VT_CONST;
    c1 = (ri32(v1+SValue_t_o) & (VT_VALMASK | VT_LVAL | VT_FORWARD)) == VT_CONST;
//     c2 = (v2->t & (VT_VALMASK | VT_LVAL | VT_FORWARD)) == VT_CONST;
    c2 = (ri32(v2+SValue_t_o) & (VT_VALMASK | VT_LVAL | VT_FORWARD)) == VT_CONST;
//     while(1) {
    while(1) {
//     if (c1 && c2) {
    if (c1 && c2) {
//         fc = v2->c.i;
        fc =ri32( v2+SValue_c_o);
        switch(op) {
//         case '+': v1->c.i += fc; break;
        case mk_char('+'): wi32(v1+SValue_c_o, ri32(v1+SValue_c_o) + fc); break;
//         case '-': v1->c.i -= fc; break;
        case mk_char('-'): wi32(v1+SValue_c_o, ri32(v1+SValue_c_o) - fc); break;
//         case '&': v1->c.i &= fc; break;
//         case '^': v1->c.i ^= fc; break;
        case mk_char('^'): wi32(v1+SValue_c_o, ri32(v1+SValue_c_o) ^ fc); break;
//         case '|': v1->c.i |= fc; break;
        case mk_char('|'): wi32(v1+SValue_c_o, ri32(v1+SValue_c_o) | fc); break;
//         case '*': v1->c.i *= fc; break;
        case mk_char('*'): wi32(v1+SValue_c_o, ri32(v1+SValue_c_o) * fc); break;
//         case TOK_PDIV:
//         case '/': v1->c.i /= fc; break; /* XXX: zero case ? */
//         case '%': v1->c.i %= fc; break; /* XXX: zero case ? */
//         case TOK_UDIV: v1->c.i = (unsigned)v1->c.i / fc; break; /* XXX: zero case ? */
//         case TOK_UMOD: v1->c.i = (unsigned)v1->c.i % fc; break; /* XXX: zero case ? */
//         case TOK_SHL: v1->c.i <<= fc; break;
        case TOK_SHL: wi32(v1+SValue_c_o, ri32(v1+SValue_c_o) << fc); break;
//         case TOK_SHR: v1->c.i = (unsigned)v1->c.i >> fc; break;
//         case TOK_SAR: v1->c.i >>= fc; break;
//             /* tests */
//         case TOK_ULT: v1->c.i = (unsigned)v1->c.i < (unsigned)fc; break;
//         case TOK_UGE: v1->c.i = (unsigned)v1->c.i >= (unsigned)fc; break;
//         case TOK_EQ: v1->c.i = v1->c.i == fc; break;
//         case TOK_NE: v1->c.i = v1->c.i != fc; break;
//         case TOK_ULE: v1->c.i = (unsigned)v1->c.i <= (unsigned)fc; break;
//         case TOK_UGT: v1->c.i = (unsigned)v1->c.i > (unsigned)fc; break;
//         case TOK_LT: v1->c.i = v1->c.i < fc; break;
//         case TOK_GE: v1->c.i = v1->c.i >= fc; break;
//         case TOK_LE: v1->c.i = v1->c.i <= fc; break;
//         case TOK_GT: v1->c.i = v1->c.i > fc; break;
//             /* logical */
//         case TOK_LAND: v1->c.i = v1->c.i && fc; break;
//         case TOK_LOR: v1->c.i = v1->c.i || fc; break;
        default:
            general_case=1;
        }
        if(general_case){
print("general gen_opc: "+op);
          err();
          break;
        }
//         vtop--;
        vtop=vtop-SValue_size;
//     } else {
    } else {
//         /* if commutative ops, put c2 as constant */
//         if (c1 && (op == '+' || op == '&' || op == '^' || 
//                    op == '|' || op == '*')) {
        if (c1 && (op == mk_char('+') || op == mk_char('&') || op == mk_char('^') || 
                   op == mk_char('|') || op == mk_char('*'))) {
//             vswap();
            vswap();
//             swap(&c1, &c2);
// FIXME ljw can't do swap
            tmp=c1;
            c1=c2;
            c2=tmp;
//         }
        }
//         fc = vtop->c.i;
        fc = ri32(vtop+SValue_c_o);
//         if (c2 && (((op == '*' || op == '/' || op == TOK_UDIV || 
//                      op == TOK_PDIV) && 
//                     fc == 1) ||
//                    ((op == '+' || op == '-' || op == '|' || op == '^' || 
//                      op == TOK_SHL || op == TOK_SHR || op == TOK_SAR) && 
//                     fc == 0) ||
//                    (op == '&' && 
//                     fc == -1))) {
        if (c2 && (((op == mk_char('*') || op == mk_char('/') || op == TOK_UDIV || 
                     op == TOK_PDIV) && 
                    fc == 1) ||
                   ((op == mk_char('+') || op == mk_char('-') || op == mk_char('|') || op == mk_char('^') || 
                     op == TOK_SHL || op == TOK_SHR || op == TOK_SAR) && 
                    fc == 0) ||
                   (op == mk_char('&') && 
                    fc == -1))) {
//             /* nothing to do */
//             vtop--;
            vtop=vtop - SValue_size;
//         } else if (c2 && (op == '*' || op == TOK_PDIV || op == TOK_UDIV)) {
        } else if (c2 && (op == mk_char('*') || op == TOK_PDIV || op == TOK_UDIV)) {
//             /* try to use shifts instead of muls or divs */
//             if (fc > 0 && (fc & (fc - 1)) == 0) {
            if (fc > 0 && (fc & (fc - 1)) == 0) {
                n = -1;
                while (fc) {
                    fc >>>= 1;
                    n++;
                }
                wi32(vtop+SValue_c_o, n);
                if (op == mk_char('*'))
                    op = TOK_SHL;
                else if (op == TOK_PDIV)
                    op = TOK_SAR;
                else
                    op = TOK_SHR;
            }
//             general_case=1;break;
            general_case=1;break;
//         } else {
        } else {
//         general_case=1;
        general_case=1;
//         }
        }
//     }
    }
//     break;
    break;
//     }
    }
//     if(general_case){
    if(general_case){
//         /* call low level op generator */
//         /* XXX: remove explicit registers */
//         gen_opi(op);
        gen_opi(op);
//     }
    }
// }
}
// 
// int pointed_size(int t)
// {
function pointed_size(t) {
    enter();
    var tmp=alloca(4);
    wi32(tmp,t);
//    return type_size(pointed_type(t), &t);
    return leave(type_size(pointed_type(ri32(tmp)), tmp));
}
// 
// /* generic gen_op: handles types problems */
// void gen_op(int op)
// {
function gen_op(op) {
//     int u, t1, t2, bt1, bt2, t;
    var u;
    var t1;
    var t2;
    var bt1;
    var bt2;
    var t;
// 
//     t1 = vtop[-1].t;
    t1 = ri32(vtop-SValue_size+SValue_t_o);
//     t2 = vtop[0].t;
    t2 = ri32(vtop+SValue_t_o);
//     bt1 = t1 & VT_BTYPE;
    bt1 = t1 & VT_BTYPE;
//     bt2 = t2 & VT_BTYPE;
    bt2 = t2 & VT_BTYPE;
//         
//     if (op == '+' || op == '-') {
    if (op == mk_char('+') || op == mk_char('-')) {
//         if ((t1 & VT_BTYPE) == VT_PTR && 
//             (t2 & VT_BTYPE) == VT_PTR) {
        if ((t1 & VT_BTYPE) == VT_PTR &&
            (t2 & VT_BTYPE) == VT_PTR) {
//             if (op != '-')
            if (op != mk_char('-'))
//                 error("invalid type");
                error("invalid type");
//             /* XXX: check that types are compatible */
//             u = pointed_size(t1);
            u = pointed_size(t1);
//             gen_opc(op);
            gen_opc(op);
//             /* set to integer type */
//             vtop->t = (vtop->t & ~VT_TYPE) | VT_INT; 
            wi32(vtop+SValue_t_o,(ri32(vtop+SValue_t_o) & ~VT_TYPE) | VT_INT); 
//             vset(VT_CONST, u);
            vset(VT_CONST, u);
//             gen_op(TOK_PDIV);
            gen_op(TOK_PDIV);
//         } else if ((t1 & VT_BTYPE) == VT_PTR ||
//                    (t2 & VT_BTYPE) == VT_PTR) {
        } else if ((t1 & VT_BTYPE) == VT_PTR ||
                   (t2 & VT_BTYPE) == VT_PTR) {
//             if ((t2 & VT_BTYPE) == VT_PTR) {
            if ((t2 & VT_BTYPE) == VT_PTR) {
err();
//                 vswap();
//                 swap(&t1, &t2);
//             }
            }
//             /* stack-4 contains pointer, stack-2 value to add */
//             vset(VT_CONST, pointed_size(vtop[-1].t));
            vset(VT_CONST, pointed_size(ri32(vtop-SValue_size+SValue_t_o)));
//             gen_op('*');
            gen_op(mk_char('*'));
//             gen_opc(op);
            gen_opc(op);
//             /* put again type if gen_opc() swaped operands */
//             vtop->t = (vtop->t & ~VT_TYPE) | (t1 & VT_TYPE);
            wi32(vtop+SValue_t_o, (ri32(vtop+SValue_t_o) & ~VT_TYPE) | (t1 & VT_TYPE));
//         } else {
        } else {
//             gen_opc(op);
            gen_opc(op);
//         }
        }
//     } else {
    } else {
//         /* XXX: test types and compute returned value */
//         if ((t1 | t2) & VT_UNSIGNED ||
//             (t1 & VT_BTYPE) == VT_PTR ||
//             (t2 & VT_BTYPE) == VT_PTR) {
        if ((t1 | t2) & VT_UNSIGNED ||
            (t1 & VT_BTYPE) == VT_PTR ||
            (t2 & VT_BTYPE) == VT_PTR) {
            if (op == TOK_SAR)
                op = TOK_SHR;
            else if (op == mk_char('/'))
                op = TOK_UDIV;
            else if (op == mk_char('%'))
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
//         gen_opc(op);
        gen_opc(op);
//     }
    }
// }
}
// 
// /* cast 'vtop' to 't' type */
// void gen_cast(int t)
// {
function gen_cast(t){
//     int r, bits, sbt, dbt, sf, df, c, st1, dt1;
    var r;
    var bits;
    var sbt;
    var dbt;
    var sf;
    var df;
    var c;
    var st1;
    var dt1;
// 
//     r = vtop->t & VT_VALMASK;
    r = ri32(vtop+SValue_t_o) & VT_VALMASK;
//     if (!(t & VT_LVAL)) {
    if (!(t & VT_LVAL)) {
//         /* if not lvalue, then we convert now */
//         dbt = t & VT_BTYPE;
        dbt = t & VT_BTYPE;
//         sbt = vtop->t & VT_BTYPE;
        sbt = ri32(vtop+SValue_t_o) & VT_BTYPE;
//         if (sbt != dbt) {
        if (sbt != dbt) {
//             c = (vtop->t & (VT_VALMASK | VT_LVAL | VT_FORWARD)) == VT_CONST;
            c = (ri32(vtop+SValue_t_o) & (VT_VALMASK | VT_LVAL | VT_FORWARD)) == VT_CONST;
//             if (dbt == VT_BYTE || dbt == VT_SHORT) {
            if (dbt == VT_BYTE || dbt == VT_SHORT) {
err();
//                 if (dbt == VT_BYTE)
//                     bits = 8;
//                 else
//                     bits = 16;
//                 if (t & VT_UNSIGNED) {
//                     vset(VT_CONST, (1 << bits) - 1);
//                     gen_op('&');
//                 } else {
//                     bits = 32 - bits;
//                     vset(VT_CONST, bits);
//                     gen_op(TOK_SHL);
//                     vset(VT_CONST, bits);
//                     gen_op(TOK_SAR);
//                 }
//             }
            }
//         }
        }
//     }
    }
//     vtop->t = (vtop->t & ~VT_TYPE) | t;
    wi32(vtop+SValue_t_o,(ri32(vtop+SValue_t_o) & ~VT_TYPE) | t);
// }
}
// 
// /* return type size. Put alignment at 'a' */
// int type_size(int t, int *a)
// {
function type_size(t, a) {
//     Sym *s;
    var s;
//     int bt;
    var bt;
// 
//     bt = t & VT_BTYPE;
    bt = t & VT_BTYPE;
//     if (bt == VT_STRUCT) {
    if (bt == VT_STRUCT) {
//         /* struct/union */
//         s = sym_find(((unsigned)t >> VT_STRUCT_SHIFT) | SYM_STRUCT);
        s = sym_find((t >>> VT_STRUCT_SHIFT) | SYM_STRUCT);
//         *a = 4; /* XXX: cannot store it yet. Doing that is safe */
        wi32(a, 4);
//         return s->c;
        return ri32(s+Sym_c_o);
//     } else if (bt == VT_PTR) {
    } else if (bt == VT_PTR) {
//         if (t & VT_ARRAY) {
        if (t & VT_ARRAY) {
//             s = sym_find(((unsigned)t >> VT_STRUCT_SHIFT));
            s = sym_find(t >>> VT_STRUCT_SHIFT);
//             return type_size(s->t, a) * s->c;
            return type_size(ri32(s+Sym_t_o), a) * ri32(s+Sym_c_o);
//         } else {
        } else {
//             *a = PTR_SIZE;
            wi32(a, PTR_SIZE);
//             return PTR_SIZE;
            return PTR_SIZE;
//         }
        }
//     } else if (bt == VT_INT || bt == VT_ENUM ) {
    } else if (bt == VT_INT || bt == VT_ENUM ) {
//         *a = 4;
        wi32(a, 4);
//         return 4;
        return 4;
//     } else if (bt == VT_SHORT) {
    } else if (bt == VT_SHORT) {
err();
//         *a = 2;
//         return 2;
//     } else {
    } else {
//         /* char, void, function, _Bool */
//         *a = 1;
        wi32(a, 1);
//         return 1;
        return 1;
//     }
    }
// }
}
// 
// /* return the pointed type of t */
// int pointed_type(int t)
// {
function pointed_type(t) {
//     Sym *s;
    var s;
//     s = sym_find(((unsigned)t >> VT_STRUCT_SHIFT));
    s = sym_find(t >>> VT_STRUCT_SHIFT);
//     return s->t | (t & ~VT_TYPE);
    return ri32(s+Sym_t_o) | (t & ~VT_TYPE);
// }
}
// 
// int mk_pointer(int t)
// {
function mk_pointer(t) {
//     int p;
    var p;
//     p = anon_sym++;
    p = anon_sym++;
//     sym_push(p, t, -1);
    sym_push(p, t, -1);
//     return VT_PTR | (p << VT_STRUCT_SHIFT) | (t & ~VT_TYPE);
    return VT_PTR | (p << VT_STRUCT_SHIFT) | (t & ~VT_TYPE);
// }
}
// 
// int is_compatible_types(int t1, int t2)
// {
function is_compatible_types(t1, t2) {
//     Sym *s1, *s2;
    var s1;
    var s2;
//     int bt1, bt2;
    var bt1;
    var bt2;
// 
//     t1 &= VT_TYPE;
    t1 &= VT_TYPE;
//     t2 &= VT_TYPE;
    t2 &= VT_TYPE;
//     bt1 = t1 & VT_BTYPE;
    bt1 = t1 & VT_BTYPE;
//     bt2 = t2 & VT_BTYPE;
    bt2 = t2 & VT_BTYPE;
//     if (bt1 == VT_PTR) {
    if (bt1 == VT_PTR) {
//         t1 = pointed_type(t1);
        t1 = pointed_type(t1);
//         /* if function, then convert implicitely to function pointer */
//         if (bt2 != VT_FUNC) {
        if (bt2 != VT_FUNC) {
//             if (bt2 != VT_PTR)
            if (bt2 != VT_PTR)
//                 return 0;
                return 0;
//             t2 = pointed_type(t2);
            t2 = pointed_type(t2);
//         }
        }
//         /* void matches everything */
//         t1 &= VT_TYPE;
        t1 &= VT_TYPE;
//         t2 &= VT_TYPE;
        t2 &= VT_TYPE;
//         if (t1 == VT_VOID || t2 == VT_VOID)
        if (t1 == VT_VOID || t2 == VT_VOID)
//             return 1;
            return 1;
//         return is_compatible_types(t1, t2);
        return is_compatible_types(t1, t2);
//     } else if (bt1 == VT_STRUCT) {
    } else if (bt1 == VT_STRUCT) {
//         return (t2 == t1);
        return (t2 == t1);
//     } else if (bt1 == VT_FUNC) {
    } else if (bt1 == VT_FUNC) {
//         if (bt2 != VT_FUNC)
        if (bt2 != VT_FUNC)
//             return 0;
            return 0;
//         s1 = sym_find(((unsigned)t1 >> VT_STRUCT_SHIFT));
        s1 = sym_find(t1 >>> VT_STRUCT_SHIFT);
//         s2 = sym_find(((unsigned)t2 >> VT_STRUCT_SHIFT));
        s2 = sym_find(t2 >>> VT_STRUCT_SHIFT);
//         if (!is_compatible_types(s1->t, s2->t))
        if (!is_compatible_types(ri32(s1+Sym_t_o), ri32(s2+Sym_t_o)))
//             return 0;
            return 0;
//         /* XXX: not complete */
//         if (s1->c == FUNC_OLD || s2->c == FUNC_OLD)
        if (ri32(s1+Sym_c_o) == FUNC_OLD || ri32(s2+Sym_c_o) == FUNC_OLD)
//             return 1;
            return 1;
err();
//         if (s1->c != s2->c)
//             return 0;
//         while (s1 != NULL) {
//             if (s2 == NULL)
//                 return 0;
//             if (!is_compatible_types(s1->t, s2->t))
//                 return 0;
//             s1 = s1->next;
//             s2 = s2->next;
//         }
//         if (s2)
//             return 0;
//         return 1;
//     } else {
    } else {
//         /* XXX: not complete */
//         return 1;
        return 1;
//     }
    }
// }
}
// 
// int check_assign_types(int t1, int t2)
// {
function check_assign_types(t1, t2){
//     t1 &= VT_TYPE;
    t1 &= VT_TYPE;
//     t2 &= VT_TYPE;
    t2 &= VT_TYPE;
//     if ((t1 & VT_BTYPE) == VT_PTR && 
//         (t2 & VT_BTYPE) == VT_FUNC) {
    if ((t1 & VT_BTYPE) == VT_PTR &&
        (t2 & VT_BTYPE) == VT_FUNC) {
err();
//         return is_compatible_types(pointed_type(t1), t2);
        return is_compatible_types(pointed_type(t1), t2);
//     } else {
    } else {
//         return is_compatible_types(t1, t2);
        return is_compatible_types(t1, t2);
//     }
    }
// }
}
// 
// /* print a type. If 'varstr' is not NULL, then the variable is also
//    printed in the type */
// /* XXX: add array and function pointers */
// /* XXX: buffer overflows */
// void type_to_str(char *buf, int buf_size, 
//                  int t, const char *varstr)
// {
//     int bt, v;
//     Sym *s, *sa;
//     char buf1[256];
// 
//     t = t & VT_TYPE;
//     bt = t & VT_BTYPE;
//     buf[0] = '\0';
//     if (t & VT_UNSIGNED)
//         strcat(buf, "unsigned ");
//     switch(bt) {
//     case VT_VOID:
//         strcat(buf, "void");
//         break;
//     case VT_BYTE:
//         strcat(buf, "char");
//         break;
//     case VT_SHORT:
//         strcat(buf, "short");
//         break;
//     case VT_INT:
//         strcat(buf, "int");
//         break;
//     case VT_ENUM:
//     case VT_STRUCT:
//         if (bt == VT_STRUCT)
//             strcat(buf, "struct ");
//         else
//             strcat(buf, "enum ");
//         v = (unsigned)t >> VT_STRUCT_SHIFT;
//         if (v >= SYM_FIRST_ANOM)
//             strcat(buf, "<anonymous>");
//         else
//             strcat(buf, get_tok_str(v, NULL));
//         break;
//     case VT_FUNC:
//         s = sym_find((unsigned)t >> VT_STRUCT_SHIFT);
//         type_to_str(buf, buf_size, s->t, varstr);
//         strcat(buf, "(");
//         sa = s->next;
//         while (sa != NULL) {
//             type_to_str(buf1, sizeof(buf1), sa->t, NULL);
//             strcat(buf, buf1);
//             sa = sa->next;
//             if (sa)
//                 strcat(buf, ", ");
//         }
//         strcat(buf, ")");
//         return;
//     case VT_PTR:
//         s = sym_find((unsigned)t >> VT_STRUCT_SHIFT);
//         strcpy(buf1, "*");
//         if (varstr)
//             strcat(buf1, varstr);
//         type_to_str(buf, buf_size, s->t, buf1);
//         return;
//     }
//     if (varstr) {
//         strcat(buf, " ");
//         strcat(buf, varstr);
//     }
// }
// 
//                  
// 
// /* verify type compatibility to store vtop in 'st' type, and generate
//    casts if needed */
// void gen_assign_cast(int dt)
// {
function gen_assign_cast(dt) {
    enter();
//     int st;
    var st;
//     char buf1[256], buf2[256];
    var buf1=alloca(256);
    var buf2=alloca(256);
// 
//     st = vtop->t; /* destination type */
    st = ri32(vtop+SValue_t_o);
//     if (!check_assign_types(dt, st)) {
    if (!check_assign_types(dt, st)) {
err();
//         type_to_str(buf1, sizeof(buf1), st, NULL);
//         type_to_str(buf2, sizeof(buf2), dt, NULL);
//         error("cannot cast '%s' to '%s'", buf1, buf2);
//     }
    }
    leave();
// }
}
// 
// 
// /* store vtop in lvalue pushed on stack */
// void vstore(void)
// {
function vstore() {
    enter();
//     int ft, fc, r, t, size, align, bit_size, bit_pos;
    var ft;
    var fc;
    var r;
    var t;
    var size;
    var align;
    var bit_size;
    var bit_pos;
//     GFuncContext gf;
    var gf=alloca(GFuncContext_size);
// 
//     ft = vtop[-1].t;
    ft = ri32(vtop-SValue_size+SValue_t_o);
//     gen_assign_cast(ft & VT_TYPE);
    gen_assign_cast(ft & VT_TYPE);
// 
//     if ((vtop->t & VT_BTYPE) == VT_STRUCT) {
    if ((ri32(vtop+SValue_t_o) & VT_BTYPE) == VT_STRUCT) {
//         /* if structure, only generate pointer */
//         /* structure assignment : generate memcpy */
//         /* XXX: optimize if small size */
// 
//         vdup();
        vdup();
//         gfunc_start(&gf);
        gfunc_start(gf);
//         /* type size */
//         size = type_size(vtop->t, &align);
        size = type_size(ri32(vtop+SValue_t_o), align);
//         vset(VT_CONST, size);
        vset(VT_CONST, size);
//         gfunc_param(&gf);
        gfunc_param(gf);
//         /* source */
//         vtop->t &= ~VT_LVAL;
        wi32(vtop+SValue_t_o,ri32(vtop+SValue_t_o) & ~VT_LVAL);
//         gfunc_param(&gf);
        gfunc_param(gf);
//         /* destination */
//         vswap();
        vswap();
//         vtop->t &= ~VT_LVAL;
        wi32(vtop+SValue_t_o,ri32(vtop+SValue_t_o) & ~VT_LVAL);
//         gfunc_param(&gf);
        gfunc_param(gf);
// 
//         save_regs();
        save_regs();
//         vset(VT_CONST, (int)&memcpy);
// FIXME ljw dummy value
        vset(VT_CONST, 0x12345678);
// if(reloc){
if(reloc){
// special=1;
special=1;
//   printf("memcpy function pointer stuff\n");
  print("memcpy function pointer stuff\n");
// }
}
//         gfunc_call(&gf);
        gfunc_call(gf);
// if(reloc){
if(reloc){
// special=0;
special=0;
// }
}
//         /* leave source on stack */
//     } else {
    } else {
//         r = gv();  /* generate value */
        r = gv();
//         ft = vtop[-1].t;
        ft = ri32(vtop-SValue_size+SValue_t_o);
//         fc = vtop[-1].c.i;
        fc = ri32(vtop-SValue_size+SValue_c_o);
//         /* if lvalue was saved on stack, must read it */
//         if ((ft & VT_VALMASK) == VT_LLOCAL) {
        if ((ft & VT_VALMASK) == VT_LLOCAL) {
//             t = get_reg(REG_CLASS_INT);
            t = get_reg(REG_CLASS_INT);
//             load(t, VT_LOCAL | VT_LVAL, fc);
            _load(t, VT_LOCAL | VT_LVAL, fc);
//             ft = (ft & ~VT_VALMASK) | t;
            ft = (ft & ~VT_VALMASK) | t;
//         }
        }
//         store(r, ft, fc);
        store(r, ft, fc);
//         vtop--;
        vtop=vtop-SValue_size;
//         vtop->t = (ft & VT_TYPE) | r;
        wi32(vtop+SValue_t_o, (ft & VT_TYPE) | r);
//         vtop->c.i = 0;
        wi32(vtop+SValue_c_o, 0);
//     }
    }
// }
    leave();
}
// 
// /* post defines POST/PRE add. c is the token ++ or -- */
// void inc(int post, int c)
// {
function inc(post, c) {
//     int r, r1;
    var r;
    var r1;
// 
//     test_lvalue();
    test_lvalue();
//     if (post)
    if (post)
//         vdup(); /* room for returned value */
        vdup();
//     vdup(); /* save lvalue */
    vdup();
//     r = gv();
    r = gv();
//     if (post) {
    if (post) {
//         /* duplicate value */
//         /* XXX: handle floats */
//         r1 = get_reg(REG_CLASS_INT);
        r1 = get_reg(REG_CLASS_INT);
//         load(r1, r, 0); /* move r to r1 */
        _load(r1, r, 0);
//         /* duplicates value */
//         vtop[-2].t = (vtop->t & VT_TYPE) | r1;
        wi32(vtop-(2*SValue_size)+SValue_t_o, (ri32(vtop+SValue_t_o) & VT_TYPE) | r1);
//         vtop[-2].c.i = 0;
        wi32(vtop-(2*SValue_size)+SValue_c_o, 0);
//     }
    }
//     /* add constant */
//     vset(VT_CONST, c - TOK_MID); 
    vset(VT_CONST, c - TOK_MID); 
//     gen_op('+');
    gen_op(mk_char('+'));
//     vstore(); /* store value */
    vstore(); /* store value */
//     if (post)
    if (post)
//         vpop(); /* if post op, return saved value */
        vpop(); /* if post op, return saved value */
// }
}
// 
// /* enum/struct/union declaration */
// int struct_decl(int u)
// {
function struct_decl(u) {
    enter();
//     int a, t, b, v, size, align, maxalign, c, offset;
    var a;
    var t;
    var b;
    var v=alloca(4);
    var size;
    var align=alloca(4);
    var maxalign;
    var c;
    var offset;
//     int bit_size, bit_pos, bsize, bt, lbit_pos;
    var bit_size;
    var bit_pos;
    var bsize;
    var bt;
    var lbit_pos;
//     Sym *s, *ss, **ps;
    var s;
    var ss;
    var ps=alloca(4);
// 
//     a = tok; /* save decl type */
    a = tok;
//     next();
    next();
    while(1){
    if (tok != mk_char('{')) {
//         v = tok;
        wi32(v, tok);
//         next();
        next();
//         /* struct already defined ? return it */
//         /* XXX: check consistency */
//         if (s = sym_find(v | SYM_STRUCT)) {
        if (s = sym_find(ri32(v) | SYM_STRUCT)) {
//             if (s->t != a)
            if (ri32(s+Sym_t_o) != a)
//                 error("invalid type");
                error("invalid type");
//             break;
            break;
//         }
        }
    } else {
//         v = anon_sym++;
        wi32(v, anon_sym++);
//     }
    }
//     s = sym_push(v | SYM_STRUCT, a, 0);
    s = sym_push(ri32(v) | SYM_STRUCT, a, 0);
//     /* put struct/union/enum name in type */
//     break;
    break;
//     }
    }
//     u = u | (v << VT_STRUCT_SHIFT);
    u = u | (ri32(v) << VT_STRUCT_SHIFT);
//     
//     if (tok == '{') {
    if (tok == mk_char('{')) {
//         next();
        next();
//         if (s->c)
        if (ri32(s+Sym_c_o))
//             error("struct/union/enum already defined");
            error("struct/union/enum already defined");
//         /* cannot be empty */
//         c = 0;
        c = 0;
//         maxalign = 0;
        maxalign = 0;
//         ps = &s->next;
        wi32(ps, s+Sym_next_o);
//         bit_pos = 0;
        bit_pos = 0;
//         offset = 0;
        offset = 0;
//         while (1) {
        while (1) {
//             if (a == TOK_ENUM) {
            if (a == TOK_ENUM) {
//                 v = tok;
                wi32(v, tok);
//                 next();
                next();
//                 if (tok == '=') {
                if (tok == mk_char('=')) {
//                     next();
                    next();
//                     c = expr_const();
                    c = expr_const();
//                 }
                }
//                 /* enum symbols have static storage */
//                 sym_push(v, VT_CONST | VT_STATIC, c);
                sym_push(ri32(v), VT_CONST | VT_STATIC, c);
//                 if (tok == ',')
                if (tok == mk_char(','))
//                     next();
                    next();
//                 c++;
                c++;
//             } else {
            } else {
//                 b = ist();
                b = ist();
//                 while (1) {
                while (1) {
//                     bit_size = -1;
                    bit_size = -1;
//                     v = 0;
                    wi32(v, 0);
//                     if (tok != ':') {
                    if (tok != mk_char(':')) {
//                         t = type_decl(&v, b, TYPE_DIRECT);
                        t = type_decl(v, b, TYPE_DIRECT);
//                         if ((t & VT_BTYPE) == VT_FUNC ||
//                             (t & (VT_TYPEDEF | VT_STATIC | VT_EXTERN)))
                        if ((t & VT_BTYPE) == VT_FUNC ||
                            (t & (VT_TYPEDEF | VT_STATIC | VT_EXTERN)))
//                             error("invalid type for '%s'", 
                            error("invalid type for '%s'", 
//                                   get_tok_str(v, NULL));
                                  get_tok_str(v, NULL));
//                     }
                    }
//                     size = type_size(t, &align);
                    size = type_size(t, align);
//                     lbit_pos = 0;
                    lbit_pos = 0;
//                     bit_pos = 0;
                    bit_pos = 0;
//                     if (v) {
                    if (ri32(v)) {
//                         /* add new memory data only if starting
//                            bit field */
//                         if (lbit_pos == 0) {
                        if (lbit_pos == 0) {
//                             if (a == TOK_STRUCT) {
                            if (a == TOK_STRUCT) {
//                                 c = (c + align - 1) & -align;
                                c = (c + ri32(align) - 1) & -ri32(align);
//                                 offset = c;
                                offset = c;
//                                 c += size;
                                c += size;
//                             } else {
                            } else {
//                                 offset = 0;
                                offset = 0;
//                                 if (size > c)
                                if (size > c)
//                                     c = size;
                                    c = size;
//                             }
                            }
//                             if (align > maxalign)
                            if (ri32(align) > maxalign) {
//                                 maxalign = align;
                                maxalign = ri32(align);
                            }
//                         }
                        }
//                         ss = sym_push(v | SYM_FIELD, t, offset);
                        ss = sym_push(ri32(v) | SYM_FIELD, t, offset);
//                         *ps = ss;
                        wi32(ri32(ps), ss);
//                         ps = &ss->next;
                        wi32(ps, ss+Sym_next_o);
//                     }
                    }
//                     if (tok == ';' || tok == -1)
                    if (tok == mk_char(';') || tok == -1)
//                         break;
                        break;
//                     skip(',');
                    skip(mk_char(','));
//                 }
                }
//                 skip(';');
                skip(mk_char(';'));
//             }
            }
//             if (tok == '}')
            if (tok == mk_char('}'))
//                 break;
                break;
//         }
        }
//         skip('}');
        skip(mk_char('}'));
//         /* size for struct/union, dummy for enum */
//         s->c = (c + maxalign - 1) & -maxalign; 
        wi32(s+Sym_c_o, (c + maxalign - 1) & -maxalign);
//     }
    }
//     return u;
    return leave(u);
// }
}
// 
// int basic_type1(int t,int u){
function basic_type1(t,u){
//     if ((t & VT_BTYPE) != 0)
    if ((t & VT_BTYPE) !== 0)
//         error("too many basic types %x", t);
        error("too many basic types %x", t);
//     t |= u;
    t |= u;
//     return t;
    return t;
// }
}
// 
// int basic_type(int t, int u){
function basic_type(t, u){
//     next();
    next();
//     return basic_type1(t,u);
    return basic_type1(t,u);
// }
}
// 
// 
// /* return 0 if no type declaration. otherwise, return the basic type
//    and skip it. 
//    XXX: A '2' is ored to ensure non zero return if int type.
//  */
// int ist(void)
// {
function ist() {
    enter();
//     int t, u;
    var t;
    var u;
//     Sym *s;
    var s;
// 
//     t = 0;
    t = 0;
//     while(1) {
    while(1) {
//         switch(tok) {
        switch(tok) {
//             /* basic types */
//         case TOK_CHAR:
        case TOK_CHAR:
            u = VT_BYTE;
            t=basic_type(t,u);
            break;
//         case TOK_VOID:
        case TOK_VOID:
//             u = VT_VOID;
            u = VT_VOID;
//             t=basic_type(t,u);
            t=basic_type(t,u);
//             break;
            break;
//         case TOK_SHORT:
        case TOK_SHORT:
err();
//             u = VT_SHORT;
//             t=basic_type(t,u);
//             break;
//         case TOK_INT:
        case TOK_INT:
//             next();
            next();
//             break;
            break;
//         case TOK_ENUM:
        case TOK_ENUM:
            u = struct_decl(VT_ENUM);
            t=basic_type1(t,u);
            break;
//         case TOK_STRUCT:
        case TOK_STRUCT:
//         case TOK_UNION:
        case TOK_UNION:
//             u = struct_decl(VT_STRUCT);
            u = struct_decl(VT_STRUCT);
//             t=basic_type1(t,u);
            t=basic_type1(t,u);
//             break;
            break;
// 
//             /* type modifiers */
//         case TOK_CONST:
        case TOK_CONST:
//         case TOK_VOLATILE:
        case TOK_VOLATILE:
//         case TOK_REGISTER:
        case TOK_REGISTER:
//         case TOK_SIGNED:
        case TOK_SIGNED:
//         case TOK_AUTO:
        case TOK_AUTO:
//         case TOK_INLINE:
        case TOK_INLINE:
//         case TOK_RESTRICT:
        case TOK_RESTRICT:
//             next();
            next();
//             break;
            break;
//         case TOK_UNSIGNED:
        case TOK_UNSIGNED:
//             t |= VT_UNSIGNED;
            t |= VT_UNSIGNED;
//             next();
            next();
//             break;
            break;
// 
//             /* storage */
//         case TOK_EXTERN:
        case TOK_EXTERN:
            t |= VT_EXTERN;
            next();
            break;
//         case TOK_STATIC:
        case TOK_STATIC:
            t |= VT_STATIC;
            next();
            break;
//         case TOK_TYPEDEF:
        case TOK_TYPEDEF:
//             t |= VT_TYPEDEF;
            t |= VT_TYPEDEF;
//             next();
            next();
//             break;
            break;
//         default:
        default:
//             s = sym_find(tok);
          s = sym_find(tok);
//             if (!s || !(s->t & VT_TYPEDEF))
          if (!s || !(ri32(s+Sym_t_o) & VT_TYPEDEF)) {
//                 return t;
               return leave(t);
          }
//             t |= (s->t & ~VT_TYPEDEF);
          t |= (ri32(s+Sym_t_o) & ~VT_TYPEDEF);
//             next();
          next();
//             break;
          break;
//         }
        }
//         t |= 2;
        t |= 2;
//     }
    }
//     return t;
    return leave(t);
// }
}
// 
// int post_type(int t)
// {
function post_type(t) {
    enter();
//     int p, n, pt, l, t1;
    var p=alloca(4);
    var n=alloca(4);
    var pt;
    var l=alloca(4);
    var t1=alloca(4);
//     int foo=alloca(4);
    var foo;
//     Sym **plast, *s, *first;
    var plast=alloca(4);
    var s=alloca(4);
    var first=alloca(4);
// 
//     if (tok == '(') {
    if (tok === mk_char('(')) {
//         /* function declaration */
//         next();
        next();
//         l = 0;
        l = 0;
//         first = NULL;
        wi32(first, NULL);
//         plast = &first;
        wi32(plast, first);
//         while (tok != ')') {
        while (tok !== mk_char(')')) {
//             foo=0;
            foo=0;
//             /* read param name and compute offset */
//             while(1){
            while(1){
//             if (l != FUNC_OLD) {
            if (ri32(l) !== FUNC_OLD) {
//                 if (!(pt = ist())) {
                if (!(pt = ist())) {
//                     if (l) {
                    if (l) {
err();
//                         error("invalid type");
//                     } else {
                    } else {
//                         l = FUNC_OLD;
                        l = FUNC_OLD;
//                         n = tok;
                        n = tok;
//                         pt = VT_INT;
                        pt = VT_INT;
//                         next();
                        next();
//                         break;
                        break;
//                     }
                    }
//                 }
                }
//                 l = FUNC_NEW;
                l = FUNC_NEW;
//                 if ((pt & VT_BTYPE) == VT_VOID && tok == ')') {
                if ((pt & VT_BTYPE) === VT_VOID && tok === mk_char(')')) {
//                     foo=1;
                    foo=1;
//                     break;
                    break;
//                 }
                }
//                 pt = type_decl(&n, pt, TYPE_DIRECT | TYPE_ABSTRACT);
                pt = type_decl(n, pt, TYPE_DIRECT | TYPE_ABSTRACT);
//                 if ((pt & VT_BTYPE) == VT_VOID)
                if ((pt & VT_BTYPE) == VT_VOID)
//                     error("parameter declared as void");
                    error("parameter declared as void");
//             } else {
            } else {
err();
//                 n = tok;
//                 pt = VT_INT;
//                 next();
//             }
            }
//             break;
            break;
//             }
            }
//             if(foo){break;}
            if(foo){break;}
//             /* array must be transformed to pointer according to ANSI C */
//             pt &= ~VT_ARRAY;
            pt &= ~VT_ARRAY;
//             s = sym_push(n | SYM_FIELD, pt, 0);
            s = sym_push(ri32(n) | SYM_FIELD, pt, 0);
//             *plast = s;
            wi32(ri32(plast), s);
//             plast = &s->next;
// FIXME ljw is this right?
            wi32(plast, s+Sym_next_o);
//             if (tok == ',') {
            if (tok == mk_char(',')) {
//                 next();
                next();
//                 if (l == FUNC_NEW && tok == TOK_DOTS) {
                if (l == FUNC_NEW && tok == TOK_DOTS) {
//                     l = FUNC_ELLIPSIS;
                    l = FUNC_ELLIPSIS;
//                     next();
                    next();
//                     break;
                    break;
//                 }
                }
//             }
            }
//         }
        }
//         /* if no parameters, then old type prototype */
//         if (l == 0)
        if (l === 0) {
//             l = FUNC_OLD;
            l = FUNC_OLD;
        }
//         skip(')');
        skip(mk_char(')'));
//         t1 = t & (VT_TYPEDEF | VT_STATIC | VT_EXTERN);
        t1 = t & (VT_TYPEDEF | VT_STATIC | VT_EXTERN);
//         t = post_type(t & ~(VT_TYPEDEF | VT_STATIC | VT_EXTERN));
        t = post_type(t & ~(VT_TYPEDEF | VT_STATIC | VT_EXTERN));
//         /* we push a anonymous symbol which will contain the function prototype */
//         p = anon_sym++;
        p = anon_sym++;
//         s = sym_push(p, t, l);
        s = sym_push(p, t, l);
//         s->next = first;
        wi32(s+Sym_next_o , ri32(first));
//         t = t1 | VT_FUNC | (p << VT_STRUCT_SHIFT);
        t = t1 | VT_FUNC | (p << VT_STRUCT_SHIFT);
//     } else if (tok == '[') {
    } else if (tok === mk_char('[')) {
//         /* array definition */
//         next();
        next();
//         n = -1;
        n = -1;
//         if (tok != ']') {
        if (tok != mk_char(']')) {
//             n = expr_const();
            n = expr_const();
//             if (n < 0)
            if (n < 0)
//                 error("invalid array size");    
                error("invalid array size");    
//         }
        }
//         skip(']');
        skip(mk_char(']'));
//         /* parse next post type */
//         t1 = t & (VT_TYPEDEF | VT_STATIC | VT_EXTERN);
        t1 = t & (VT_TYPEDEF | VT_STATIC | VT_EXTERN);
//         t = post_type(t & ~(VT_TYPEDEF | VT_STATIC | VT_EXTERN));
        t = post_type(t & ~(VT_TYPEDEF | VT_STATIC | VT_EXTERN));
//         
//         /* we push a anonymous symbol which will contain the array
//            element type */
//         p = anon_sym++;
        p = anon_sym++;
//         sym_push(p, t, n);
        sym_push(p, t, n);
//         t = t1 | VT_ARRAY | VT_PTR | (p << VT_STRUCT_SHIFT);
        t = t1 | VT_ARRAY | VT_PTR | (p << VT_STRUCT_SHIFT);
//     }
    }
//     return t;
    return leave(t);
// }
}
// 
// /* Read a type declaration (except basic type), and return the
//    type. If v is true, then also put variable name in 'vtop->c' */
// int type_decl(int *v, int t, int td)
// {
function  type_decl(v, t, td) {
    enter();
//     int u, p;
    var u;
    var p;
//     Sym *s;
    var s;
// 
//     t = t & -3; /* suppress the ored '2' */
    t = t & -3;
//     while (tok == '*') {
    while (tok == mk_char('*')) {
//         next();
       next();
//         while (tok == TOK_CONST || tok == TOK_VOLATILE || tok == TOK_RESTRICT)
       while (tok == TOK_CONST || tok == TOK_VOLATILE || tok == TOK_RESTRICT)
//             next();
           next();
//         t = mk_pointer(t);
       t = mk_pointer(t);
//     }
    }
//     
//     /* recursive type */
//     /* XXX: incorrect if abstract type for functions (e.g. 'int ()') */
//     if (tok == '(') {
    if (tok === mk_char('(')) {
//         next();
        next();
//         u = type_decl(v, 0, td);
        u = type_decl(v, 0, td);
//         skip(')');
        skip(mk_char(')'));
//     } else {
    } else {
//         u = 0;
        u = 0;
//         /* type identifier */
//         if (tok >= TOK_IDENT && (td & TYPE_DIRECT)) {
        if (tok >= TOK_IDENT && (td & TYPE_DIRECT)) {
//             *v = tok;
            wi32(v, tok);
//             next();
            next();
//         } else {
         } else {
//             if (!(td & TYPE_ABSTRACT))
            if (!(td & TYPE_ABSTRACT))
//                 expect("identifier");
                expect("identifier");
//             *v = 0;
            wi32(v, 0);
//         }
         }
//     }
    }
//     /* append t at the end of u */
//     t = post_type(t);
print("tok: "+tok+" t: "+t);
    t = post_type(t);
//     if (!u) 
    if (!u) {
//         return t;
        return leave(t);
    }
//     p = u;
    p = u;
//     while(1) {
    while(1) {
//         s = sym_find((unsigned)p >> VT_STRUCT_SHIFT);
        s = sym_find(p >>> VT_STRUCT_SHIFT);
//         p = s->t;
        p = ri32(s+Sym_t_o);
//         if (!p) {
        if (!p) {
//             s->t = t;
            wi32(s+Sym_t_o, t);
//             break;
            break;
//         }
        }
//     }
    }
//     return u;
    return leave(u);
// }
}
// 
// /* define a new external reference to a function 'v' of type 'u' */
// Sym *external_sym(int v, int u)
// {
function external_sym(v, u) {
//     Sym *s;
    var s;
//     s = sym_find(v);
    s = sym_find(v);
//     if (!s) {
    if (!s) {
//         /* push forward reference */
//         s = sym_push1(&global_stack, 
//                       v, u | VT_CONST | VT_FORWARD, 0);
        s = sym_push1(global_stack, 
                      v, u | VT_CONST | VT_FORWARD, 0);
//     }
    }
//     return s;
    return s;
// }
}
// 
// void indir(void)
// {
function indir() {
//     if (vtop->t & VT_LVAL)
    if (ri32(vtop+SValue_t_o) & VT_LVAL) {
//         gv();
        gv();
    }
//     if ((vtop->t & VT_BTYPE) != VT_PTR)
    if ((ri32(vtop+SValue_t_o) & VT_BTYPE) != VT_PTR) {
err();
//         expect("pointer");
        expect("pointer");
}
//     vtop->t = pointed_type(vtop->t);
    wi32(vtop+SValue_t_o,pointed_type(ri32(vtop+SValue_t_o)));
//     if (!(vtop->t & VT_ARRAY)) /* an array is never an lvalue */
    if (!(ri32(vtop+SValue_t_o) & VT_ARRAY)) {
//         vtop->t |= VT_LVAL;
        wi32(vtop+SValue_t_o, ri32(vtop+SValue_t_o) | VT_LVAL);
    }
// }
}
// 
// /* pass a parameter to a function and do type checking and casting */
// void gfunc_param_typed(GFuncContext *gf, Sym *func, Sym *arg)
// {
function gfunc_param_typed(gf, func, arg) {
//     int func_type;
    var func_type;
//     func_type = func->c;
    func_type = ri32(func+Sym_c_o);
//     if (func_type == FUNC_OLD ||
//         (func_type == FUNC_ELLIPSIS && arg == NULL)) {
print("func_type: "+func_type+" arg "+arg);
    if (func_type == FUNC_OLD ||
        (func_type == FUNC_ELLIPSIS && arg == NULL)) {
//         /* default casting : only need to convert float to double */
//         if ((vtop->t & VT_BTYPE) == VT_FLOAT)
        if ((ri32(vtop+SValue_t_o) & VT_BTYPE) == VT_FLOAT) {
err();
//             gen_cast(VT_DOUBLE);
            gen_cast(VT_DOUBLE);
        }
//     } else if (arg == NULL) {
    } else if (arg == NULL) {
err();
//         error("too many arguments to function");
//     } else {
    } else {
//         gen_assign_cast(arg->t);
        gen_assign_cast(ri32(arg+Sym_t_o));
//     }
    }
//     gfunc_param(gf);
    gfunc_param(gf);
// }
}
// 
// void unary(void)
// {
function unary() {
    enter();
//     int n, t, ft, fc, p, align, size;
    var n=alloca(4);
    var t;
    var ft;
    var fc;
    var p;
    var align=alloca(4);
    var size;
//     Sym *s;
    var s;
//     GFuncContext gf;
    var gf=alloca(4);
// 
//     if (tok == TOK_NUM || tok == TOK_CCHAR || tok == TOK_LCHAR) {
    if (tok == TOK_NUM || tok == TOK_CCHAR || tok == TOK_LCHAR) {
//         vset(VT_CONST | VT_INT, tokc.i);
        vset(VT_CONST | VT_INT, ri32(tokc));
//         next();
        next();
//     } else if (tok == TOK___FUNC__) {
    } else if (tok == TOK___FUNC__) {
err();
//         /* special function name identifier */
//         /* generate (char *) type */
//         vset(VT_CONST | mk_pointer(VT_BYTE), glo);
//         strcpy((void *)glo, funcname);
//         glo += strlen(funcname) + 1;
//         next();
//     } else if (tok == TOK_STR) {
    } else if (tok == TOK_STR) {
//         /* string parsing */
//         t = VT_BYTE;
        t = VT_BYTE;
//         type_size(t, &align);
        type_size(t, align);
//         glo = (glo + align - 1) & -align;
        glo = (glo + ri32(align) - 1) & -ri32(align);
//         fc = glo;
        fc = glo;
//         /* we must declare it as an array first to use initializer parser */
//         t = VT_CONST | VT_ARRAY | mk_pointer(t);
        t = VT_CONST | VT_ARRAY | mk_pointer(t);
//         decl_initializer(t, glo, 1, 0);
        decl_initializer(t, glo, 1, 0);
//         glo += type_size(t, &align);
        glo += type_size(t, ri32(align));
//         /* put it as pointer */
//         vset(t & ~VT_ARRAY, fc);
        vset(t & ~VT_ARRAY, fc);
//     } else {
    } else {
//         t = tok;
        t = tok;
//         next();
        next();
//         if (t == '(') {
        if (t == mk_char('(')) {
//             /* cast ? */
//             if (t = ist()) {
            if (t = ist()) {
//                 ft = type_decl(&n, t, TYPE_ABSTRACT);
                ft = type_decl(n, t, TYPE_ABSTRACT);
//                 skip(')');
                skip(mk_char(')'));
//                 /* check ISOC99 compound literal */
//                 if (tok == '{') {
                if (tok == mk_char('{')) {
err();
//                     /* data is allocated locally by default */
//                     if (global_expr)
//                         ft |= VT_CONST;
//                     else
//                         ft |= VT_LOCAL;
//                     /* all except arrays are lvalues */
//                     if (!(ft & VT_ARRAY))
//                         ft |= VT_LVAL;
//                     fc = decl_initializer_alloc(ft, 1);
//                     vset(ft, fc);
//                 } else {
                } else {
//                     unary();
                    unary();
//                     gen_cast(ft);
                    gen_cast(ft);
//                 }
                }
//             } else {
            } else {
//                 gexpr();
                gexpr();
//                 skip(')');
                skip(mk_char(')'));
//             }
            }
//         } else if (t == '*') {
        } else if (t == mk_char('*')) {
//             unary();
            unary();
//             indir();
            indir();
//         } else if (t == '&') {
        } else if (t == mk_char('&')) {
//             unary();
            unary();
//             /* functions names must be treated as function pointers,
//                except for unary '&' and sizeof. Since we consider that
//                functions are not lvalues, we only have to handle it
//                there and in function calls. */
//             if ((vtop->t & VT_BTYPE) != VT_FUNC)
            if ((ri32(vtop+SValue_t_o) & VT_BTYPE) != VT_FUNC) {
//                 test_lvalue();
                test_lvalue();
            }
//             vtop->t = mk_pointer(vtop->t & VT_LVALN);
            wi32(vtop+SValue_t_o, mk_pointer(ri32(vtop+SValue_t_o) & VT_LVALN));
//         } else
//         if (t == '!') {
        } else if (t == mk_char('!')) {
//             unary();
            unary();
            if ((ri32(vtop+SValue_t_o) & (VT_VALMASK | VT_LVAL)) == VT_CONST) {
err();
//                 vtop->c.i = !vtop->c.i;
            } else if ((ri32(vtop+SValue_t_o) & VT_VALMASK) == VT_CMP) {
//                 vtop->c.i = vtop->c.i ^ 1;
                wi32(vtop+SValue_c_o, ri32(vtop+SValue_c_o) ^ 1);
            } else {
                vset(VT_JMP, gtst(1, 0));
            }
//         } else
//         if (t == '~') {
        } else if (t == mk_char('~')) {
//             unary();
            unary();
//             vset(VT_CONST, -1);
            vset(VT_CONST, -1);
//             gen_op('^');
            gen_op(mk_char('^'));
//         } else 
//         if (t == '+') {
        } else if (t == mk_char('+')) {
err();
//             unary();
//         } else 
//         if (t == TOK_SIZEOF) {
        } else if (t == TOK_SIZEOF) {
//             if (tok == '(') {
            if (tok == mk_char('(')) {
//                 next();
                next();
//                 if (t = ist())
                if (t = ist()) {
//                     t = type_decl(&n, t, TYPE_ABSTRACT);
                    t = type_decl(n, t, TYPE_ABSTRACT);
//                 else {
                } else {
err();
//                     /* XXX: some code could be generated: add eval
//                        flag */
//                     gexpr();
//                     t = vtop->t;
//                     vpop();
//                 }
                }
//                 skip(')');
                skip(mk_char(')'));
//             } else {
            } else {
err();
//                 unary();
//                 t = vtop->t;
//                 vpop();
//             }
            }
//             vset(VT_CONST, type_size(t, &t));
// FIXME ljw had to use dummy alloca
            vset(VT_CONST, type_size(t, alloca(4)));
//         } else
//         if (t == TOK_INC || t == TOK_DEC) {
        } else if (t == TOK_INC || t == TOK_DEC) {
err();
//             unary();
//             inc(0, t);
//         } else if (t == '-') {
        } else if (t == mk_char('-')) {
//             vset(VT_CONST, 0);
            vset(VT_CONST, 0);
//             unary();
            unary();
//             gen_op('-');
            gen_op(mk_char('-'));
//         } else 
//         {
        } else {
//             s = sym_find(t);
            s = sym_find(t);
//             if (!s) {
            if (!s) {
//                 if (tok != '(')
                if (tok !== mk_char('('))
//                     error("'%s' undeclared", get_tok_str(t, NULL));
                    error("'%s' undeclared", get_tok_str(t, NULL));
//                 /* for simple function calls, we tolerate undeclared
//                    external reference */
//                 p = anon_sym++;        
                p = anon_sym++;
//                 sym_push1(&global_stack, p, 0, FUNC_OLD);
                sym_push1(global_stack, p, 0, FUNC_OLD);
//                 /* int() function */
//                 s = external_sym(t, VT_FUNC | (p << VT_STRUCT_SHIFT)); 
                s = external_sym(t, VT_FUNC | (p << VT_STRUCT_SHIFT));
//             }
            }
//             vset(s->t, s->c);
            vset(ri32(s+Sym_t_o), ri32(s+Sym_c_o));
//             /* if forward reference, we must point to s */
//             if (vtop->t & VT_FORWARD)
            if (ri32(vtop+SValue_t_o) & VT_FORWARD) {
//                 vtop->c.sym = s;
                wi32(vtop+SValue_c_o, s);
            }
//         }
        }
//     }
    }
//     
//     /* post operations */
//     while (1) {
    while (1) {
//         if (tok == TOK_INC | tok == TOK_DEC) {
        if (tok == TOK_INC | tok == TOK_DEC) {
//             inc(1, tok);
            inc(1, tok);
//             next();
            next();
//         } else if (tok == '.' | tok == TOK_ARROW) {
        } else if (tok == mk_char('.') | tok == TOK_ARROW) {
//             /* field */ 
//             if (tok == TOK_ARROW) 
            if (tok == TOK_ARROW) {
//                 indir();
                indir();
            }
//             test_lvalue();
            test_lvalue();
//             vtop->t &= VT_LVALN;
            wi32(vtop+SValue_t_o, ri32(vtop+SValue_t_o) & VT_LVALN);
//             next();
            next();
//             /* expect pointer on structure */
//             if ((vtop->t & VT_BTYPE) != VT_STRUCT)
            if ((ri32(vtop+SValue_t_o) & VT_BTYPE) != VT_STRUCT) {
err();
//                 expect("struct or union");
                expect("struct or union");
            }
//             s = sym_find(((unsigned)vtop->t >> VT_STRUCT_SHIFT) | SYM_STRUCT);
            s = sym_find((ri32(vtop+SValue_t_o) >>> VT_STRUCT_SHIFT) | SYM_STRUCT);
//             /* find field */
//             tok |= SYM_FIELD;
            tok |= SYM_FIELD;
//             while (s = s->next) {
            while (s = ri32(s+Sym_next_o)) {
//                 if (s->v == tok)
                if (ri32(s+Sym_v_o) == tok)
//                     break;
                    break;
//             }
            }
//             if (!s)
            if (!s)
//                 error("field not found");
                error("field not found");
//             /* add field offset to pointer */
//             vtop->t = (vtop->t & ~VT_TYPE) | VT_INT; /* change type to int */
            wi32(vtop+SValue_t_o,(ri32(vtop+SValue_t_o) & ~VT_TYPE) | VT_INT);
//             vset(VT_CONST, s->c);
            vset(VT_CONST, ri32(s+Sym_c_o));
//             gen_op('+');
            gen_op(mk_char('+'));
//             /* change type to field type, and set to lvalue */
//             vtop->t = (vtop->t & ~VT_TYPE) | s->t;
            wi32(vtop+SValue_t_o, (ri32(vtop+SValue_t_o) & ~VT_TYPE) | ri32(s+Sym_t_o));
//             /* an array is never an lvalue */
//             if (!(vtop->t & VT_ARRAY))
            if (!(ri32(vtop+SValue_t_o) & VT_ARRAY)) {
//                 vtop->t |= VT_LVAL;
                wi32(vtop+SValue_t_o, ri32(vtop+SValue_t_o) | VT_LVAL);
            }
//             next();
            next();
//         } else if (tok == '[') {
        } else if (tok == mk_char('[')) {
//             next();
            next();
//             gexpr();
            gexpr();
//             gen_op('+');
            gen_op(mk_char('+'));
//             indir();
            indir();
//             skip(']');
            skip(mk_char(']'));
//         } else if (tok == '(') {
        } else if (tok == mk_char('(')) {
//             int rett;
            var rett;
//             CValue retc;
            retc=alloca(4);
//             Sym *sa;
            var sa;
// 
//             /* function call  */
//             if ((vtop->t & VT_BTYPE) != VT_FUNC) {
            if ((ri32(vtop+SValue_t_o) & VT_BTYPE) != VT_FUNC) {
err();
//                 /* pointer test (no array accepted) */
//                 if ((vtop->t & (VT_BTYPE | VT_ARRAY)) == VT_PTR) {
//                     vtop->t = pointed_type(vtop->t);
//                     if ((vtop->t & VT_BTYPE) != VT_FUNC)
//                         expect("function pointer");
//                 } else {
//                     expect("function pointer");
//                 }
//             } else {
            } else {
//                 vtop->t &= ~VT_LVAL; /* no lvalue */
                wi32(vtop+SValue_t_o, ri32(vtop+SValue_t_o) & ~VT_LVAL);
//             }
            }
//             /* get return type */
//             s = sym_find((unsigned)vtop->t >> VT_STRUCT_SHIFT);
            s = sym_find(ri32(vtop+SValue_t_o) >>> VT_STRUCT_SHIFT);
//             save_regs(); /* save used temporary registers */
            save_regs();
//             gfunc_start(&gf);
            gfunc_start(gf);
//             next();
            next();
//             sa = s->next; /* first parameter */
            sa = ri32(s+Sym_next_o); /* first parameter */
//             {
//                 int *str, len, parlevel, *saved_macro_ptr;
                var str=alloca(4);
                var len=alloca(4);
                var parlevel;
                var saved_macro_ptr;
//                 Sym *args, *s1;
                var args=alloca(4);
                var s1;
// 
//                 /* read each argument and store it on a stack */
//                 /* XXX: merge it with macro args ? */
//                 args = NULL;
                wi32(args, NULL);
//                 while (tok != ')') {
                while (tok !== mk_char(')')) {
//                     len = 0;
                    wi32(len, 0);
//                     str = NULL;
                    wi32(str, NULL);
//                     parlevel = 0;
                    parlevel = 0;
//                     while ((parlevel > 0 || (tok != ')' && tok != ',')) && 
//                            tok != -1) {
                    while ((parlevel > 0 || (tok != mk_char(')') && tok != mk_char(','))) && 
                           tok != -1) {
//                         if (tok == '(')
                        if (tok == mk_char('('))
//                             parlevel++;
                            parlevel++;
//                         else if (tok == ')')
                        else if (tok == mk_char(')'))
//                             parlevel--;
                            parlevel--;
//                         tok_add2(&str, &len, tok, &tokc);
                        tok_add2(str, len, tok, tokc);
//                         next();
                        next();
//                     }
                    }
//                     tok_add(&str, &len, -1); /* end of file added */
                    tok_add(str, len, -1); /* end of file added */
//                     tok_add(&str, &len, 0);
                    tok_add(str, len, 0);
// FIXME ljw is this right
//                     s1 = sym_push2(&args, 0, 0, (int)str);
                    s1 = sym_push2(args, 0, 0, ri32(str));
//                     s1->next = sa; /* add reference to argument */
                    wi32(s1+Sym_next_o, sa); /* add reference to argument */
//                     if (sa)
                    if (sa)
//                         sa = sa->next;
                        sa = ri32(sa+Sym_next_o);
//                     if (tok != ',')
                    if (tok != mk_char(','))
//                         break;
                        break;
//                     next();
                    next();
//                 }
                }
//                 if (tok != ')')
                if (tok != mk_char(')'))
//                     expect(")");
                    expect(")");
//                 
//                 /* now generate code in reverse order by reading the stack */
//                 saved_macro_ptr = macro_ptr;
                saved_macro_ptr = ri32(macro_ptr);
//                 while (args) {
                while (ri32(args)) {
//                     macro_ptr = (int *)args->c;
                    wi32(macro_ptr, ri32(ri32(args)+Sym_c_o));
//                     next();
                    next();
//                     expr_eq();
                    expr_eq();
//                     if (tok != -1)
                    if (tok != -1)
//                         expect("',' or ')'");
                        expect("',' or ')'");
//                     gfunc_param_typed(&gf, s, args->next);
                    gfunc_param_typed(gf, s, ri32(ri32(args)+Sym_next_o));
//                     s1 = args->prev;
                    s1 = ri32(ri32(args)+Sym_prev_o);
// FIXME ljw should free
//                     free((int *)args->c);
//                     free(args);
//                     args = s1;
                    wi32(args, s1);
//                 }
                }
//                 macro_ptr = saved_macro_ptr;
                wi32(macro_ptr, saved_macro_ptr);
//                 /* restore token */
//                 tok = ')';
                tok = mk_char(')');
//             }
//             /* compute first implicit argument if a structure is returned */
//             if ((s->t & VT_BTYPE) == VT_STRUCT) {
            if ((ri32(s+Sym_t_o) & VT_BTYPE) == VT_STRUCT) {
err();
//                 /* get some space for the returned structure */
//                 size = type_size(s->t, &align);
//                 loc = (loc - size) & -align;
//                 rett = s->t | VT_LOCAL | VT_LVAL;
//                 /* pass it as 'int' to avoid structure arg passing
//                    problems */
//                 vset(VT_INT | VT_LOCAL, loc);
//                 retc = vtop->c;
//                 gfunc_param(&gf);
//             } else {
            } else {
//                 rett = s->t | FUNC_RET_REG; /* return in register */
                rett = ri32(s+Sym_t_o) | FUNC_RET_REG;
//                 retc.i = 0;
                wi32(retc, 0);
//             }
            }
//             if (sa)
            if (sa)
//                 error("too few arguments to function %x", sa->t);
                error("too few arguments to function %x");
//             skip(')');
            skip(mk_char(')'));
//             gfunc_call(&gf);
            gfunc_call(gf);
//             /* return value */
//             vsetc(rett, &retc);
            vsetc(rett, retc);
//         } else {
        } else {
//             break;
            break;
//         }
        }
//     }
    }
// }
    leave();
}
// 
// void uneq(void)
// {
function uneq() {
//     int t;
    var t;
//     
//     unary();
    unary();
//     if (tok == '=' ||
//         (tok >= TOK_A_MOD && tok <= TOK_A_DIV) ||
//         tok == TOK_A_XOR || tok == TOK_A_OR ||
//         tok == TOK_A_SHL || tok == TOK_A_SAR) {
    if (tok == mk_char('=') ||
        (tok >= TOK_A_MOD && tok <= TOK_A_DIV) ||
        tok == TOK_A_XOR || tok == TOK_A_OR ||
        tok == TOK_A_SHL || tok == TOK_A_SAR) {
//         test_lvalue();
        test_lvalue();
//         t = tok;
        t = tok;
//         next();
        next();
//         if (t == '=') {
        if (t == mk_char('=')) {
//             expr_eq();
            expr_eq();
//         } else {
        } else {
//             vdup();
            vdup();
//             expr_eq();
            expr_eq();
//             gen_op(t & 0x7f);
            gen_op(t & 0x7f);
//         }
        }
//         vstore();
        vstore();
//     }
    }
// }
}
// 
// void sum(int l)
// {
function sum(l) {
//     int t;
    var t;
// 
//     if (l == 0)
    if (l === 0) {
//         uneq();
        uneq();
//     else {
    } else {
//         sum(--l);
        sum(--l);
//         while ((l == 0 & (tok == '*' | tok == '/' | tok == '%')) |
        while ((l == 0 & (tok == mk_char('*') | tok == mk_char('/') | tok == mk_char('%'))) |
//                (l == 1 & (tok == '+' | tok == '-')) |
               (l == 1 & (tok == mk_char('+') | tok == mk_char('-'))) |
//                (l == 2 & (tok == TOK_SHL | tok == TOK_SAR)) |
               (l == 2 & (tok == TOK_SHL | tok == TOK_SAR)) |
//                (l == 3 & ((tok >= TOK_ULE & tok <= TOK_GT) |
               (l == 3 & ((tok >= TOK_ULE & tok <= TOK_GT) |
//                           tok == TOK_ULT | tok == TOK_UGE)) |
                          tok == TOK_ULT | tok == TOK_UGE)) |
//                (l == 4 & (tok == TOK_EQ | tok == TOK_NE)) |
               (l == 4 & (tok == TOK_EQ | tok == TOK_NE)) |
//                (l == 5 & tok == '&') |
               (l == 5 & tok == mk_char('&')) |
//                (l == 6 & tok == '^') |
               (l == 6 & tok == mk_char('^')) |
//                (l == 7 & tok == '|') |
               (l == 7 & tok == mk_char('|')) |
//                (l == 8 & tok == TOK_LAND) |
               (l == 8 & tok == TOK_LAND) |
//                (l == 9 & tok == TOK_LOR)) {
               (l == 9 & tok == TOK_LOR)) {
//             t = tok;
            t = tok;
//             next();
            next();
//             sum(l);
            sum(l);
//             gen_op(t);
            gen_op(t);
//        }
       }
//     }
    }
// }
}
// 
// /* only used if non constant */
// void eand(void)
// {
function eand() {
//     int t;
    var t;
// 
//     sum(8);
    sum(8);
//     t = 0;
    t = 0;
//     while (1) {
    while (1) {
//         if (tok != TOK_LAND) {
        if (tok != TOK_LAND) {
//             if (t) {
            if (t) {
//                 t = gtst(1, t);
                t = gtst(1, t);
//                 vset(VT_JMPI, t);
                vset(VT_JMPI, t);
//             }
            }
//             break;
            break;
//         }
        }
//         t = gtst(1, t);
        t = gtst(1, t);
//         next();
        next();
//         sum(8);
        sum(8);
//     }
    }
// }
}
// 
// void eor(void)
// {
function eor() {
//     int t;
    var t;
// 
//     eand();
    eand();
//     t = 0;
    t = 0;
//     while (1) {
    while (1) {
//         if (tok != TOK_LOR) {
        if (tok != TOK_LOR) {
//             if (t) {
            if (t) {
//                 t = gtst(0, t);
                t = gtst(0, t);
//                 vset(VT_JMP, t);
                vset(VT_JMP, t);
//             }
            }
//             break;
            break;
//         }
        }
//         t = gtst(0, t);
        t = gtst(0, t);
//         next();
        next();
//         eand();
        eand();
//     }
    }
// }
}
// 
// /* XXX: better constant handling */
// void expr_eq(void)
// {
function expr_eq() {
//     int t, u, c, r1, r2;
    var t;
    var u;
    var c;
    var r1;
    var r2;
// 
//     if (const_wanted) {
    if (const_wanted) {
//         sum(10);
        sum(10);
//         if (tok == '?') {
        if (tok == mk_char('?')) {
err();
//             c = vtop->c.i;
//             vpop();
//             next();
//             gexpr();
//             t = vtop->c.i;
//             vpop();
//             skip(':');
//             expr_eq();
//             if (c)
//                 vtop->c.i = t;
//         }
        }
//     } else {
    } else {
//         eor();
        eor();
//         if (tok == '?') {
        if (tok === mk_char('?')) {
err();
//             next();
//             t = gtst(1, 0);
// 
//             gexpr();
//             r1 = gv();
//             vpop();
//             skip(':');
//             u = gjmp(0);
// 
//             gsym(t);
//             expr_eq();
//             r2 = gv();
//             move_reg(r1, r2);
//             vtop->t = (vtop->t & VT_TYPE) | r1;
//             gsym(u);
//         }
        }
//     }
    }
// }
}
// 
// void gexpr(void)
// {
function gexpr() {
//     while (1) {
    while (1) {
//         expr_eq();
        expr_eq();
//         if (tok != ',')
        if (tok !== mk_char(','))
//             break;
            break;
//         vpop();
        vpop();
//         next();
        next();
//     }
    }
// }
}
// 
// /* parse a constant expression and return value in vtop */
// void expr_const1(void)
// {
function expr_const1() {
//     int a;
    var a;
//     a = const_wanted;
    a = const_wanted;
//     const_wanted = 1;
    const_wanted = 1;
//     expr_eq();
    expr_eq();
//     if ((vtop->t & (VT_CONST | VT_LVAL)) != VT_CONST)
    if ((ri32(vtop+SValue_t_o) & (VT_CONST | VT_LVAL)) != VT_CONST)
//         expect("constant");
        expect("constant");
//     const_wanted = a;
    const_wanted = a;
// }
}
// 
// /* parse an integer constant and return its value */
// int expr_const(void)
// {
function expr_const() {
//     int c;
    var c;
//     expr_const1();
    expr_const1();
//     c = vtop->c.i;
    c = ri32(vtop+SValue_c_o);
//     vpop();
    vpop();
//     return c;
    return c;
// }
}
// 
// /* return the label token if current token is a label, otherwise
//    return zero */
// int is_label(void)
// {
//     int t;
//     CValue c;
// 
//     /* fast test first */
//     if (tok < TOK_UIDENT)
//         return 0;
//     /* no need to save tokc since we expect an identifier */
//     t = tok;
//     c = tokc;
//     next();
//     if (tok == ':') {
//         next();
//         return t;
//     } else {
//         /* XXX: may not work in all cases (macros ?) */
//         tok1 = tok;
//         tok1c = tokc;
//         tok = t;
//         tokc = c;
//         return 0;
//     }
// }
// 
// void block(int *bsym, int *csym, int *case_sym, int *def_sym, int case_reg)
// {
function block(bsym, csym, case_sym, def_sym, case_reg) {
//     int a, b, c, d;
    enter();
    var a=alloca(4);
    var b=alloca(4);
    var c=alloca(4);
    var d;
//     Sym *s;
    var s;
// 
//     if (tok == TOK_IF) {
    if (tok == TOK_IF) {
//         /* if test */
//         next();
        next();
//         skip('(');
        skip(mk_char('('));
//         gexpr();
        gexpr();
//         skip(')');
        skip(mk_char(')'));
//         a = gtst(1, 0);
        a = gtst(1, 0);
//         block(bsym, csym, case_sym, def_sym, case_reg);
        block(bsym, csym, case_sym, def_sym, case_reg);
//         c = tok;
        c = tok;
//         if (c == TOK_ELSE) {
        if (c == TOK_ELSE) {
//             next();
            next();
//             d = gjmp(0);
            d = gjmp(0);
//             gsym(a);
            gsym(a);
//             block(bsym, csym, case_sym, def_sym, case_reg);
            block(bsym, csym, case_sym, def_sym, case_reg);
//             gsym(d); /* patch else jmp */
            gsym(d); /* patch else jmp */
//         } else
        } else {
//             gsym(a);
            gsym(a);
        }
//     } else if (tok == TOK_WHILE) {
    } else if (tok == TOK_WHILE) {
//         next();
        next();
//         d = ind;
        d = ind;
//         skip('(');
        skip(mk_char('('));
//         gexpr();
        gexpr();
//         skip(')');
        skip(mk_char(')'));
//         a = gtst(1, 0);
        wi32(a, gtst(1, 0));
//         b = 0;
        wi32(b, 0);
//         block(&a, &b, case_sym, def_sym, case_reg);
        block(a, b, case_sym, def_sym, case_reg);
//         oad(0xe9, d - ind - 5); /* jmp */
        oad(0xe9, d - ind - 5);
//         gsym(a);
        gsym(a);
//         gsym_addr(b, d);
        gsym_addr(b, d);
//     } else if (tok == '{') {
    } else if (tok == mk_char('{')) {
//         next();
        next();
//         /* declarations */
//         s = local_stack.top;
        s = ri32(local_stack+SymStack_top_o);
//         while (tok != '}') {
        while (tok !== mk_char('}')) {
//             decl(VT_LOCAL);
            decl(VT_LOCAL);
//             if (tok != '}')
            if (tok !== mk_char('}')) {
//                 block(bsym, csym, case_sym, def_sym, case_reg);
                block(bsym, csym, case_sym, def_sym, case_reg);
            }
//         }
        }
//         /* pop locally defined symbols */
//         sym_pop(&local_stack, s);
        sym_pop(local_stack, s);
//         next();
        next();
//     } else if (tok == TOK_RETURN) {
    } else if (tok == TOK_RETURN) {
//         next();
        next();
//         if (tok != ';') {
        if (tok !== mk_char(';')) {
//             gexpr();
            gexpr();
//             if ((func_vt & VT_BTYPE) == VT_STRUCT) {
            if ((func_vt & VT_BTYPE) == VT_STRUCT) {
err();
//                 /* if returning structure, must copy it to implicit
//                    first pointer arg location */
//                 vset(mk_pointer(func_vt) | VT_LOCAL | VT_LVAL, func_vc);
//                 indir();
//                 vswap();
//                 /* copy structure value to pointer */
//                 vstore();
//             } else {
err();
            } else {
//                 /* move return value to standard return register */
//                 move_reg(FUNC_RET_REG, gv());
                move_reg(FUNC_RET_REG, gv());
//             }
            }
//             vpop();
            vpop();
//         }
        }
//         skip(';');
        skip(mk_char(';'));
//         rsym = gjmp(rsym); /* jmp */
        rsym = gjmp(rsym);
//     } else if (tok == TOK_BREAK) {
    } else if (tok == TOK_BREAK) {
//         /* compute jump */
//         if (!bsym)
        if (!bsym)
//             error("cannot break");
            error("cannot break");
//         *bsym = gjmp(*bsym);
        wi32(bsym, gjmp(ri32(bsym)));
//         next();
        next();
//         skip(';');
        skip(mk_char(';'));
//     } else if (tok == TOK_CONTINUE) {
    } else if (tok == TOK_CONTINUE) {
//         /* compute jump */
        /* compute jump */
//         if (!csym)
        if (!csym)
//             error("cannot continue");
            error("cannot continue");
//         *csym = gjmp(*csym);
        wi32(csym, gjmp(ri32(csym)));
//         next();
        next();
//         skip(';');
        skip(mk_char(';'));
//     } else if (tok == TOK_FOR) {
    } else if (tok == TOK_FOR) {
//         int e;
        var e;
//         next();
        next();
//         skip('(');
        skip(mk_char('('));
//         if (tok != ';') {
        if (tok != mk_char(';')) {
//             gexpr();
            gexpr();
//             vpop();
            vpop();
//         }
        }
//         skip(';');
        skip(mk_char(';'));
//         d = ind;
        d = ind;
//         c = ind;
        c = ind;
//         a = 0;
        wi32(a, 0);
//         b = 0;
        wi32(b, 0);
//         if (tok != ';') {
        if (tok != mk_char(';')) {
//             gexpr();
            gexpr();
//             a = gtst(1, 0);
            wi32(a, gtst(1, 0));
//         }
        }
//         skip(';');
        skip(mk_char(';'));
//         if (tok != ')') {
        if (tok != ')') {
//             e = gjmp(0);
            e = gjmp(0);
//             c = ind;
            c = ind;
//             gexpr();
            gexpr();
//             vpop();
            vpop();
//             oad(0xe9, d - ind - 5); /* jmp */
            oad(0xe9, d - ind - 5); /* jmp */
            gsym(e);
//             gsym(e);
//         }
        }
//         skip(')');
        skip(mk_char(')'));
//         block(&a, &b, case_sym, def_sym, case_reg);
        block(a, b, case_sym, def_sym, case_reg);
//         oad(0xe9, c - ind - 5); /* jmp */
        oad(0xe9, c - ind - 5); /* jmp */
//         gsym(a);
        gsym(ri32(a));
//         gsym_addr(b, c);
        gsym_addr(ri32(b), c);
//     } else 
//     if (tok == TOK_DO) {
    } else if (tok == TOK_DO) {
err();
//         next();
//         a = 0;
//         b = 0;
//         d = ind;
//         block(&a, &b, case_sym, def_sym, case_reg);
//         skip(TOK_WHILE);
//         skip('(');
//         gsym(b);
//         gexpr();
//         c = gtst(0, 0);
//         gsym_addr(c, d);
//         skip(')');
//         gsym(a);
//         skip(';');
//     } else
//     if (tok == TOK_SWITCH) {
    } else if (tok == TOK_SWITCH) {
        next();
        skip(mk_char('('));
        gexpr();
        case_reg = gv();
        vpop();
        skip(mk_char(')'));
        wi32(a, 0);
        wi32(b, gjmp(0)); /* jump to first case */
        wi32(c, 0);
        block(a, csym, b, c, case_reg);
        /* if no default, jmp after switch */
        if (ri32(c) == 0)
            wi32(c, ind);
        /* default label */
        gsym_addr(ri32(b), ri32(c));
        /* break label */
        gsym(ri32(a));
//     } else
//     if (tok == TOK_CASE) {
    } else if (tok == TOK_CASE) {
//         next();
        next();
//         a = expr_const();
        a = expr_const();
//         if (!case_sym)
        if (!case_sym)
//             expect("switch");
            expect("switch");
//         /* since a case is like a label, we must skip it with a jmp */
        /* since a case is like a label, we must skip it with a jmp */
//         b = gjmp(0);
        b = gjmp(0);
//         gsym(*case_sym);
        gsym(ri32(case_sym));
//         vset(case_reg, 0);
        vset(case_reg, 0);
//         vset(VT_CONST, a);
        vset(VT_CONST, a);
//         gen_op(TOK_EQ);
        gen_op(TOK_EQ);
//         *case_sym = gtst(1, 0);
        wi32(case_sym, gtst(1, 0));
//         gsym(b);
        gsym(b);
//         skip(':');
        skip(mk_char(':'));
//         block(bsym, csym, case_sym, def_sym, case_reg);
        block(bsym, csym, case_sym, def_sym, case_reg);
//     } else 
//     if (tok == TOK_DEFAULT) {
    } else if (tok == TOK_DEFAULT) {
//         next();
        next();
//         skip(':');
        skip(mk_char(':'));
//         if (!def_sym)
        if (!def_sym)
//             expect("switch");
            expect("switch");
//         if (*def_sym)
        if (ri32(def_sym))
//             error("too many 'default'");
            error("too many 'default'");
//         *def_sym = ind;
        wi32(def_sym, ind);
//         block(bsym, csym, case_sym, def_sym, case_reg);
        block(bsym, csym, case_sym, def_sym, case_reg);
//     } else {
    } else {
//         /* expression case */
//         if (tok != ';') {
        if (tok !== mk_char(';')) {
//             gexpr();
            gexpr();
//             vpop();
            vpop();
//         }
        }
//         skip(';');
        skip(mk_char(';'));
//     }
    }
// }
    leave();
}
// 
// /* t is the array or struct type. c is the array or struct
//    address. cur_index/cur_field is the pointer to the current
//    value. 'size_only' is true if only size info is needed (only used
//    in arrays) */
// void decl_designator(int t, int c, 
//                      int *cur_index, Sym **cur_field, 
//                      int size_only)
// {
function decl_designator(t, c, cur_index, cur_field, size_only) {
    enter();
//     Sym *s, *f;
    var s;
    var f;
//     int notfirst, index, align, l;
    var notfirst;
    var index;
    var align;
    var l;
// 
//     notfirst = 0;
    notfirst = 0;
// 
//     while (tok == '[' || tok == '.') {
    while (tok == mk_char('[') || tok == mk_char('.')) {
err();
//         if (tok == '[') {
//             if (!(t & VT_ARRAY))
//                 expect("array type");
//             s = sym_find(((unsigned)t >> VT_STRUCT_SHIFT));
//             next();
//             index = expr_const();
//             if (index < 0 || (s->c >= 0 && index >= s->c))
//                 expect("invalid index");
//             skip(']');
//             if (!notfirst)
//                 *cur_index = index;
//             t = pointed_type(t);
//             c += index * type_size(t, &align);
//         } else {
//             next();
//             l = tok;
//             next();
//             if ((t & VT_BTYPE) != VT_STRUCT)
//                 expect("struct/union type");
//             s = sym_find(((unsigned)t >> VT_STRUCT_SHIFT) | SYM_STRUCT);
//             l |= SYM_FIELD;
//             f = s->next;
//             while (f) {
//                 if (f->v == l)
//                     break;
//                 f = f->next;
//             }
//             if (!f)
//                 expect("field");
//             if (!notfirst)
//                 *cur_field = f;
//             t = f->t | (t & ~VT_TYPE);
//             c += f->c;
//         }
//         notfirst = 1;
//     }
    }
//     if (notfirst) {
    if (notfirst) {
err();
//         if (tok == '=') {
//             next();
//         } else {
//             if (!gnu_ext)
//                 expect("=");
//         }
//     } else {
    } else {
//         if (t & VT_ARRAY) {
        if (t & VT_ARRAY) {
//             index = *cur_index;
            index = ri32(cur_index);
//             t = pointed_type(t);
            t = pointed_type(t);
//             c += index * type_size(t, &align);
            c += index * type_size(t, align);
//         } else {
        } else {
err();
//             f = *cur_field;
//             if (!f)
//                 error("too many field init");
//             t = f->t | (t & ~VT_TYPE);
//             c += f->c;
//         }
        }
//     }
    }
//     decl_initializer(t, c, 0, size_only);
    decl_initializer(t, c, 0, size_only);
// }
    leave();
}
// 
// /* store a value or an expression directly in global data or in local array */
// 
// void init_putv(int t, int c, int v, int is_expr)
// {
function init_putv(t, c, v, is_expr) {
//     int saved_global_expr, bt;
    var saved_global_expr;
    var bt;
// 
//     if ((t & VT_VALMASK) == VT_CONST) {
    if ((t & VT_VALMASK) == VT_CONST) {
//         if (is_expr) {
        if (is_expr) {
//             /* compound literals must be allocated globally in this case */
//             saved_global_expr = global_expr;
            saved_global_expr = global_expr;
//             global_expr = 1;
            global_expr = 1;
//             expr_const1();
            expr_const1();
//             global_expr = saved_global_expr;
            global_expr = saved_global_expr;
//         } else {
        } else {
//             vset(VT_CONST | VT_INT, v);
            vset(VT_CONST | VT_INT, v);
//         }
        }
//         /* XXX: do casting */
//         /* XXX: not portable */
//         bt = vtop->t & VT_BTYPE;
        bt = ri32(vtop+SValue_t_o) & VT_BTYPE;
//         switch(bt) {
        switch(bt) {
//         case VT_BYTE:
        case VT_BYTE:
err();
//             *(char *)c = vtop->c.i;
//             break;
//         case VT_SHORT:
        case VT_SHORT:
err();
//             *(short *)c = vtop->c.i;
//             break;
//         default:
        default:
//             *(int *)c = vtop->c.i;
            wi32(c, ri32(vtop+SValue_c_o));
//             break;
            break;
//         }
        }
//         vpop();
        vpop();
//     } else {
    } else {
//         vset(t, c);
        vset(t, c);
//         if (is_expr)
        if (is_expr)
//             expr_eq();
            expr_eq();
//         else
        else
//             vset(VT_CONST | VT_INT, v);
            vset(VT_CONST | VT_INT, v);
//         vstore();
        vstore();
//         vpop();
        vpop();
//     }
    }
// }
}
// 
// /* put zeros for variable based init */
// void init_putz(int t, int c, int size)
// {
//     GFuncContext gf;
// 
//     if ((t & VT_VALMASK) == VT_CONST) {
//         /* nothing to do because global are already set to zero */
//     } else {
//         gfunc_start(&gf);
//         vset(VT_CONST, size);
//         gfunc_param(&gf);
//         vset(VT_CONST, 0);
//         gfunc_param(&gf);
//         vset(VT_LOCAL, c);
//         gfunc_param(&gf);
//         vset(VT_CONST, (int)&memset);
// if(reloc){
//   printf("memset function point stuff\n");
// }
//         gfunc_call(&gf);
//     }
// }
// 
// /* 't' contains the type and storage info. c is the address of the
//    object. 'first' is true if array '{' must be read (multi dimension
//    implicit array init handling). 'size_only' is true if size only
//    evaluation is wanted (only for arrays). */
// void decl_initializer(int t, int c, int first, int size_only)
// {
function decl_initializer(t, c, first, size_only) {
print("decl_initializer: t: "+t+" c: "+c+" first: "+first+" size_only: "+size_only);
    enter();
//     int index, array_length, n, no_oblock, nb, parlevel, i;
    var index=alloca(4);
    var array_length;
    var n;
    var no_oblockl
    var nb;
    var parlevel;
    var i;
//     int t1, size1, align1;
    var t1;
    var size1;
    var align1=alloca(4);
//     Sym *s, *f;
    var s=alloca(4);
    var f=alloca(4);
//     TokenSym *ts;
    var ts=alloca(4);
// 
//     if (t & VT_ARRAY) {
    if (t & VT_ARRAY) {
//         s = sym_find(((unsigned)t >> VT_STRUCT_SHIFT));
        s = sym_find((t >>> VT_STRUCT_SHIFT));
//         n = s->c;
        n = ri32(s+Sym_c_o);
//         array_length = 0;
        array_length = 0;
//         t1 = pointed_type(t);
        t1 = pointed_type(t);
//         size1 = type_size(t1, &align1);
        size1 = type_size(t1, align1);
// 
//         no_oblock = 1;
        no_oblock = 1;
//         if ((first && tok != TOK_LSTR && tok != TOK_STR) || 
//             tok == '{') {
        if ((first && tok != TOK_LSTR && tok != TOK_STR) || 
            tok == mk_char('{')) {
//             skip('{');
            skip(mk_char('{'));
//             no_oblock = 0;
            no_oblock = 0;
//         }
        }
// 
//         /* only parse strings here if correct type (otherwise: handle
//            them as ((w)char *) expressions */
//         if ((tok == TOK_LSTR && 
//              (t1 & VT_BTYPE) == VT_INT) ||
//             (tok == TOK_STR &&
//              (t1 & VT_BTYPE) == VT_BYTE)) {
        if ((tok == TOK_LSTR && 
             (t1 & VT_BTYPE) == VT_INT) ||
            (tok == TOK_STR &&
             (t1 & VT_BTYPE) == VT_BYTE)) {
//             /* XXX: move multiple string parsing in parser ? */
//             while (tok == TOK_STR || tok == TOK_LSTR) {
            while (tok == TOK_STR || tok == TOK_LSTR) {
//                 ts = tokc.ts;
                ts = ri32(tokc);
//                 /* compute maximum number of chars wanted */
//                 nb = ts->len;
                nb = ri32(ts+TokenSym_len_o);
//                 if (n >= 0 && nb > (n - array_length))
                if (n >= 0 && nb > (n - array_length))
//                     nb = n - array_length;
                    nb = n - array_length;
//                 if (!size_only) {
                if (!size_only) {
//                     if (ts->len > nb)
                    if (ri32(ts+TokenSym_len_o) > nb)
//                         warning("initializer-string for array is too long");
                        warning("initializer-string for array is too long");
//                     for(i=0;i<nb;i++) {
                    for(i=0;i<nb;i++) {
//                         init_putv(t1, c + (array_length + i) * size1, 
//                                   ts->str[i], 0);
                        init_putv(t1, c + (array_length + i) * size1, 
                                  ri8(ts+TokenSym_str_o+i), 0);
//                     }
                    }
//                 }
                }
//                 array_length += nb;
                array_length += nb;
//                 next();
                next();
//             }
            }
//             /* only add trailing zero if enough storage (no
//                warning in this case since it is standard) */
//             if (n < 0 || array_length < n) {
            if (n < 0 || array_length < n) {
//                 if (!size_only) {
                if (!size_only) {
//                     init_putv(t1, c + (array_length * size1), 0, 0);
                    init_putv(t1, c + (array_length * size1), 0, 0);
//                 }
                }
//                 array_length++;
                array_length++;
//             }
            }
//         } else {
        } else {
//             index = 0;
            wi32(index, 0);
//             while (tok != '}') {
             while (tok != mk_char('}')) {
//                 decl_designator(t, c, &index, NULL, size_only);
                decl_designator(t, c, index, NULL, size_only);
//                 if (n >= 0 && index >= n)
                if (n >= 0 && ri32(index) >= n)
//                     error("index too large");
                    error("index too large");
//                 /* must put zero in holes (note that doing it that way
//                    ensures that it even works with designators) */
//                 if (!size_only && array_length < index) {
                if (!size_only && array_length < ri32(index)) {
err();
//                     init_putz(t1, c + array_length * size1, 
//                               (index - array_length) * size1);
//                 }
                }
//                 index++;
                wi32(index,ri32(index)+1);
//                 if (index > array_length)
                if (ri32(index) > array_length) {
//                     array_length = index;
                    array_length = ri32(index);
}
//                 /* special test for multi dimensional arrays (may not
//                    be strictly correct if designators are used at the
//                    same time) */
//                 if (index >= n && no_oblock)
                if (ri32(index) >= n && no_oblock) {
err();
//                     break;
                    break;
                }
//                 if (tok == '}')
                if (tok == mk_char('}'))
//                     break;
                    break;
//                 skip(',');
                skip(mk_char(','));
//             }
            }
//         }
        }
//         if (!no_oblock)
        if (!no_oblock)
//             skip('}');
            skip(mk_char('}'));
//         /* put zeros at the end */
//         if (!size_only && n >= 0 && array_length < n) {
        if (!size_only && n >= 0 && array_length < n) {
//             init_putz(t1, c + array_length * size1, 
//                       (n - array_length) * size1);
            init_putz(t1, c + array_length * size1, 
                      (n - array_length) * size1);
//         }
        }
//         /* patch type size if needed */
//         if (n < 0)
        if (n < 0)
//             s->c = array_length;
            wi32(s+Sym_c_o, array_length);
//     } else if ((t & VT_BTYPE) == VT_STRUCT && tok == '{') {
    } else if ((t & VT_BTYPE) == VT_STRUCT && tok == mk_char('{')) {
err();
//         /* XXX: union needs only one init */
//         next();
//         s = sym_find(((unsigned)t >> VT_STRUCT_SHIFT) | SYM_STRUCT);
//         f = s->next;
//         array_length = 0;
//         index = 0;
//         n = s->c;
//         while (tok != '}') {
//             decl_designator(t, c, NULL, &f, size_only);
//             /* fill with zero between fields */
//             index = f->c;
//             if (!size_only && array_length < index) {
//                 init_putz(t, c + array_length, 
//                           index - array_length);
//             }
//             index = index + type_size(f->t, &align1);
//             if (index > array_length)
//                 array_length = index;
//             if (tok == '}')
//                 break;
//             skip(',');
//             f = f->next;
//         }
//         /* put zeros at the end */
//         if (!size_only && array_length < n) {
//             init_putz(t, c + array_length, 
//                       n - array_length);
//         }
//         skip('}');
//     } else if (tok == '{') {
    } else if (tok == mk_char('{')) {
err();
//         next();
//         decl_initializer(t, c, first, size_only);
//         skip('}');
//     } else if (size_only) {
    } else if (size_only) {
err();
//         /* just skip expression */
//         parlevel = 0;
//         while ((parlevel > 0 || (tok != '}' && tok != ',')) && 
//                tok != -1) {
//             if (tok == '(')
//                 parlevel++;
//             else if (tok == ')')
//                 parlevel--;
//             next();
//         }
//     } else {
    } else {
//         init_putv(t, c, 0, 1);
        init_putv(t, c, 0, 1);
//     }
    }
// }
   return leave();
}
// 
// /* parse an initializer for type 't' if 'has_init' is true, and
//    allocate space in local or global data space. The allocated address
//    in returned */
// int decl_initializer_alloc(int t, int has_init)
// {
function decl_initializer_alloc(t, has_init) {
print("decl_initializer_alloc: t: "+t+" has_init: "+has_init);
    enter();
//     int size, align, addr, tok1;
    var size;
    var align=alloca(4);
    var addr;
    var tok1;
//     int *init_str, init_len, level, *saved_macro_ptr;
    var init_str=alloca(4);
    var init_len=alloca(4);
    var level=alloca(4);
    var saved_macro_ptr;
// 
//     size = type_size(t, &align);
    size = type_size(t, align);
//     /* If unknown size, we must evaluate it before
//        evaluating initializers because
//        initializers can generate global data too
//        (e.g. string pointers or ISOC99 compound
//        literals). It also simplifies local
//        initializers handling */
//     init_len = 0;
    wi32(init_len, 0);
//     init_str = NULL;
    wi32(init_str, NULL);
//     saved_macro_ptr = NULL; /* avoid warning */
    saved_macro_ptr = NULL;
//     tok1 = 0;
    tok1 = 0;
//     if (size < 0) {
    if (size < 0) {
err();
//         if (!has_init) 
//             error("unknown type size");
//         /* get all init string */
//         level = 0;
//         while (level > 0 || (tok != ',' && tok != ';')) {
//             if (tok < 0)
//                 error("unexpect end of file in initializer");
//             tok_add2(&init_str, &init_len, tok, &tokc);
//             if (tok == '{')
//                 level++;
//             else if (tok == '}') {
//                 if (level == 0)
//                     break;
//                 level--;
//             }
//             next();
//         }
//         tok1 = tok;
//         tok_add(&init_str, &init_len, -1);
//         tok_add(&init_str, &init_len, 0);
//         
//         /* compute size */
//         saved_macro_ptr = macro_ptr;
//         macro_ptr = init_str;
//         next();
//         decl_initializer(t, 0, 1, 1);
//         /* prepare second initializer parsing */
//         macro_ptr = init_str;
//         next();
//         
//         /* if still unknown size, error */
//         size = type_size(t, &align);
//         if (size < 0) 
//             error("unknown type size");
//     }
    }
//     if ((t & VT_VALMASK) == VT_LOCAL) {
    if ((t & VT_VALMASK) == VT_LOCAL) {
//         loc = (loc - size) & -align;
        loc = (loc - size) & -(ri32(align));
//         addr = loc;
        addr = loc;
//     } else {
    } else {
//         glo = (glo + align - 1) & -align;
        glo = (glo + ri32(align) - 1) & -ri32(align);
//         addr = glo;
        addr = glo;
//         /* very important to increment global
//            pointer at this time because
//            initializers themselves can create new
//            initializers */
//         glo += size;
        glo += size;
//     }
    }
//     if (has_init) {
    if (has_init) {
//         decl_initializer(t, addr, 1, 0);
        decl_initializer(t, addr, 1, 0);
//         /* restore parse state if needed */
//         if (init_str) {
        if (ri32(init_str)) {
err();
//             free(init_str);
//             macro_ptr = saved_macro_ptr;
//             tok = tok1;
//         }
        }
//     }
    }
//     return addr;
// }
    return leave(addr);
}
// 
// 
// /* 'l' is VT_LOCAL or VT_CONST to define default storage type */
// void decl(int l)
// {
function decl(l) {
    enter();
//     int *a, t, b, v, u, addr, has_init, size, align;
    var a=alloca(4);
    var t=alloca(4);
    var b=alloca(4);
    var v=alloca(4);
    var u=alloca(4);
    var addr=alloca(4);
    var has_init=alloca(4);
    var size=alloca(4);
    var align=alloca(4);
//     Sym *sym;
    var sym;
//     
//     while (1) {
    while (1) {
//         b = ist();
         b = ist();
//         if (!b) {
         if (!b) {
//             /* skip redundant ';' */
//             /* XXX: find more elegant solution */
//             if (tok == ';') {
            if (tok === mk_char(';')) {
                next();
                continue;
            }
//             /* special test for old K&R protos without explicit int
//                type. Only accepted when defining global data */
//             if (l == VT_LOCAL || tok < TOK_DEFINE)
            if (l == VT_LOCAL || tok < TOK_DEFINE) {
//                 break;
                break;
            }
//             b = VT_INT;
err();
            b = VT_INT;
//         }
         }
//         if (((b & VT_BTYPE) == VT_ENUM ||
         if (((b & VT_BTYPE) == VT_ENUM ||
//              (b & VT_BTYPE) == VT_STRUCT) && 
              (b & VT_BTYPE) == VT_STRUCT) &&
//             tok == ';') {
             tok === mk_char(';')) {
//             /* we accept no variable after */
//             next();
             next();
//             continue;
             continue;
//         }
err();
         }
//         while (1) { /* iterate thru each declaration */
         while (1) { /* iterate thru each declaration */
//             t = type_decl(&v, b, TYPE_DIRECT);
            t = type_decl(v, b, TYPE_DIRECT);
//             if (tok == '{') {
            if (tok === mk_char('{')) {
//                 if (l == VT_LOCAL)
                if (l === VT_LOCAL) {
//                     error("cannot use local functions");
                    error("cannot use local functions");
                }
//                 if (!(t & VT_FUNC))
                if (!(t & VT_FUNC)) {
//                     expect("function definition");
                    expect("function definition");
                }
//                 /* patch forward references */
//                 if ((sym = sym_find(v)) && (sym->t & VT_FORWARD)) {
                if ((sym = sym_find(ri32(v))) && (ri32(sym+Sym_t_o) & VT_FORWARD)) {
//                     greloc_patch(sym, ind);
                    greloc_patch(sym, ind);
//                     sym->t = VT_CONST | t;
                    wi32(sym+Sym_t_o, VT_CONST | t);
//                 } else {
                } else {
//                     /* put function address */
//                     sym_push1(&global_stack, v, VT_CONST | t, ind);
                    sym_push1(global_stack, ri32(v), VT_CONST | t, ind);
//                 }
                }
//                 funcname = get_tok_str(v, NULL);
                funcname = get_tok_str(ri32(v), NULL);
print("funcname: "+mk_js_string(funcname));
// hd(funcname,64);
//                 /* push a dummy symbol to enable local sym storage */
//                 sym_push1(&local_stack, 0, 0, 0);
                sym_push1(local_stack, 0, 0, 0);
//                 /* define parameters */
//                 sym = sym_find((unsigned)t >> VT_STRUCT_SHIFT);
                sym = sym_find(t >>> VT_STRUCT_SHIFT);
//                 /* XXX: the following is x86 dependant -> move it to
//                    x86 code gen */
//                 addr = 8;
                addr = 8;
//                 /* if the function returns a structure, then add an
//                    implicit pointer parameter */
//                 func_vt = sym->t;
                func_vt = ri32(sym+Sym_t_o);
print("func_vt: "+func_vt);
//                 if ((func_vt & VT_BTYPE) == VT_STRUCT) {
                if ((func_vt & VT_BTYPE) === VT_STRUCT) {
err();
//                     func_vc = addr;
//                     addr += 4;
//                 }
                }
//                 while (sym = sym->next) {
                while (sym = ri32(sym+Sym_next_o)) {
//                     u = sym->t;
                    u = ri32(sym+Sym_t_o);
//                     sym_push(sym->v & ~SYM_FIELD, 
//                              u | VT_LOCAL | VT_LVAL, 
//                              addr);
                    sym_push(ri32(sym+Sym_v_o) & ~SYM_FIELD, 
                             u | VT_LOCAL | VT_LVAL, 
                             addr);
//                     size = type_size(u, &align);
                    size = type_size(u, align);
//                     size = (size + 3) & ~3;
                    size = (size + 3) & ~3;
//                     addr += size;
                    addr += size;
//                 }
                }
//                 loc = 0;
                loc = 0;
//                 o(0xe58955); /* push   %ebp, mov    %esp, %ebp */
                o(0xe58955); /* push   %ebp, mov    %esp, %ebp */
//                 a = (int *)oad(0xec81, 0); /* sub $xxx, %esp */
                a = oad(0xec81, 0);
//                 rsym = 0;
                rsym = 0;
//                 block(NULL, NULL, NULL, NULL, 0);
                block(NULL, NULL, NULL, NULL, 0);
//                 gsym(rsym);
                gsym(rsym);
//                 o(0xc3c9); /* leave, ret */
                o(0xc3c9); /* leave, ret */
//                 *a = (-loc + 3) & -4; /* align local size to word & 
//                                          save local variables */
                wi32(a, (-loc + 3) & -4);
// FIXME ljw not needed
//                 sym_pop(&label_stack, NULL); /* reset label stack */
//                 sym_pop(&local_stack, NULL); /* reset local stack */
                sym_pop(local_stack, NULL);
//                 funcname = ""; /* for safety */
                funcname = mk_c_string("");
//                 func_vt = VT_VOID; /* for safety */
                func_vt = VT_VOID;
//                 break;
                break;
//             } else {
            } else {
//                 if (b & VT_TYPEDEF) {
                if (b & VT_TYPEDEF) {
//                     /* save typedefed type  */
//                     /* XXX: test storage specifiers ? */
//                     sym_push(v, t | VT_TYPEDEF, 0);
                    sym_push(ri32(v), t | VT_TYPEDEF, 0);
//                 } else if ((t & VT_BTYPE) == VT_FUNC) {
                } else if ((t & VT_BTYPE) == VT_FUNC) {
//                     /* external function definition */
//                     external_sym(v, t);
                    external_sym(ri32(v), t);
//                 } else {
                } else {
//                     /* not lvalue if array */
//                     if (!(t & VT_ARRAY))
                    if (!(t & VT_ARRAY)) {
//                         t |= VT_LVAL;
                        t |= VT_LVAL;
                    }
//                     if (b & VT_EXTERN) {
                    if (b & VT_EXTERN) {
                        /* external variable */
                        external_sym(ri32(v), t);
//                     } else {
                    } else {
//                         u = l;
                        u = l;
//                         if (t & VT_STATIC)
                        if (t & VT_STATIC)
//                             u = VT_CONST;
                            u = VT_CONST;
//                         u |= t;
                        u |= t;
//                         has_init = (tok == '=');
                        has_init = (tok === mk_char('='));
//                         if (has_init)
                        if (has_init)
//                             next();
                            next();
//                         addr = decl_initializer_alloc(u, has_init);
                        addr = decl_initializer_alloc(u, has_init);
//                         while(1){
                        while(1){
//                         if (l == VT_CONST) {
                        if (l == VT_CONST) {
//                             /* global scope: see if already defined */
//                             sym = sym_find(v);
                            sym = sym_find(ri32(v));
//                             if (!sym) {
                            if (!sym) {
//                                 sym_push(v, u, addr);
                                sym_push(ri32(v), u, addr);
//                                 break;
                                break;
//                             }
                            }
//                             if (!is_compatible_types(sym->t, u))
                            if (!is_compatible_types(ri32(sym+Sym_t_o), u))
//                                 error("incompatible types for redefinition of '%s'", 
                                error("incompatible types for redefinition of '%s'", 
//                                       get_tok_str(v, NULL));
                                      get_tok_str(v, NULL));
//                             if (!(sym->t & VT_FORWARD))
                            if (!(ri32(sym+Sym_t_o) & VT_FORWARD))
//                                 error("redefinition of '%s'", get_tok_str(v, NULL));
                                error("redefinition of '%s'", get_tok_str(v, NULL));
//                             greloc_patch(sym, addr);
                            greloc_patch(sym, addr);
//                         } else {
                        } else {
//                             sym_push(v, u, addr);
                            sym_push(ri32(v), u, addr);
//                         }
                        }
//                         break;
                        break;
//                         }
                        }
//                     }
                    }
//                 }
                }
//                 if (tok != ',') {
                if (tok !== mk_char(',')) {
//                     skip(';');
                    skip(mk_char(';'));
//                     break;
                    break;
//                 }
                }
//                 next();
                next();
//             }
            }
//         }
         }
//     }
     }
// }
    leave();
}
// 
// /* put all global symbols in the extern stack and do all the
//    resolving which can be done without using external symbols from DLLs */
// /* XXX: could try to verify types, but would not to save them in
//    extern_stack too */
// void resolve_global_syms(void)
// {
function resolve_global_syms() {
    enter();
//     Sym *s, *s1, *ext_sym;
    var s;
    var s1;
    var ext_sym;
//     Reloc **p;
    var p;
// 
//     s = global_stack.top;
    s = ri32(global_stack+SymStack_top_o);
//     while (s != NULL) {
    while (s !== NULL) {
//         s1 = s->prev;
        s1 = ri32(s+Sym_prev_o);
//         /* do not save static or typedefed symbols or types */
//         if (!(s->t & (VT_STATIC | VT_TYPEDEF)) && 
//             !(s->v & (SYM_FIELD | SYM_STRUCT)) &&
//             (s->v < SYM_FIRST_ANOM)) {
        if (!(ri32(s+Sym_t_o) & (VT_STATIC | VT_TYPEDEF)) &&
            !(ri32(s+Sym_v_o) & (SYM_FIELD | SYM_STRUCT)) &&
            (ri32(s+Sym_v_o) < SYM_FIRST_ANOM)) {
//             ext_sym = sym_find1(&extern_stack, s->v);
            ext_sym = sym_find1(extern_stack, ri32(s+Sym_v_o));
//             if (!ext_sym) {
            if (!ext_sym) {
//                 /* if the symbol do not exist, we simply save it */
//                 sym_push1(&extern_stack, s->v, s->t, s->c);
                sym_push1(extern_stack, ri32(s+Sym_v_o), ri32(s+Sym_t_o), ri32(s+Sym_c_o));
//             } else if (ext_sym->t & VT_FORWARD) {
            } else if (ri32(ext_sym+Sym_t_o) & VT_FORWARD) {
err();
//                 /* external symbol already exists, but only as forward
//                    definition */
//                 if (!(s->t & VT_FORWARD)) {
//                     /* s is not forward, so we can relocate all symbols */
//                     greloc_patch(ext_sym, s->c);
//                 } else {
//                     /* the two symbols are forward: merge them */
//                     p = (Reloc **)&ext_sym->c;
//                     while (*p != NULL)
//                         p = &(*p)->next;
//                     *p = (Reloc *)s->c;
//                 }
//             } else {
            } else {
err();
//                 /* external symbol already exists and is defined :
//                    patch all references to it */
//                 if (!(s->t & VT_FORWARD))
//                     error("'%s' defined twice", get_tok_str(s->v, NULL));
//                 greloc_patch(s, ext_sym->c);
//             }
            }
//         } 
        }
//         s = s1;
        s = s1;
//     }
    }
    leave();
// }
}
// 
// /* compile a C file. Return non zero if errors. */
// int tcc_compile_file(const char *filename1)
// {
function tcc_compile_file(filename1) {
    enter();
    print("filename: "+mk_js_string(ri32(filename1)));
//     Sym *define_start;
    var define_start;
// 
//     filename = (char *)filename1;
    filename = ri32(filename1);
// 
//     line_num = 1;
    line_num = 1;
//     funcname = "";
    funcname = "";
//     file = fopen(filename, "r");
    file = fopen(filename, mk_c_string("r"));
//     if (!file)
    if (!file) {
//         error("file '%s' not found", filename);
        error("file '%s' not found", filename);
    }
//     include_stack_ptr = include_stack;
    include_stack_ptr = include_stack;
// FIXME ljw not needed:
//     ifdef_stack_ptr = ifdef_stack;
// 
//     vtop = vstack - 1;
    vtop = vstack - SValue_size;
//     anon_sym = SYM_FIRST_ANOM; 
    anon_sym = SYM_FIRST_ANOM;
//     
//     define_start = define_stack.top;
    define_start = ri32(define_stack+SymStack_top_o);
//     inp();
    inp();
//     ch = '\n'; /* needed to parse correctly first preprocessor command */
    ch = mk_char('\n');
//     next();
    next();
//     decl(VT_CONST);
    decl(VT_CONST);
//     if (tok != -1)
    if (tok != -1)
//         expect("declaration");
        expect("declaration");
//     fclose(file);
    fclose(file);

// 
//     /* reset define stack, but leave -Dsymbols (may be incorrect if
//        they are undefined) */
//     sym_pop(&define_stack, define_start); 
    sym_pop(define_stack, define_start);
//     
//     resolve_global_syms();
    resolve_global_syms();
//     
//     sym_pop(&global_stack, NULL);
    sym_pop(global_stack, NULL);
//     
//     return 0;
    return leave(0);
// }
}
// 
// void resolve_extern_syms(void)
// {
function resolve_extern_syms() {
    enter();
// // HACK RELOC
// reloc_global=1;
reloc_global=1;
//     Sym *s, *s1;
    var s;
    var s1;
//     char *str;
    var str;
//     int addr;
    var addr;
// int count;
    var count;
//     s = extern_stack.top;
    s = ri32(extern_stack+SymStack_top_o);
//     while (s != NULL) {
    while (s != NULL) {
//         s1 = s->prev;
        s1 = ri32(s+Sym_prev_o);
//         if (s->t & VT_FORWARD) {
        if (ri32(s+Sym_t_o) & VT_FORWARD) {
//             /* if there is at least one relocation to do, then find it
//                and patch it */
//             if (s->c) {
            if (ri32(s+Sym_c_o)) {
//                 str = get_tok_str(s->v, NULL);
                str = get_tok_str(ri32(s+Sym_v_o), NULL);
print("resolve_extern_syms str: "+mk_js_string(str));
// ljw dummy address
                addr=0x12345678;
// FIXME ljw dlsym not needed
//                 addr = (int)dlsym(NULL, str);
//                 if (!addr)
//                     error("unresolved external reference '%s'", str);
//                 count=greloc_patch(s, addr);
                count=greloc_patch(s, addr);
// if(reloc){
if(reloc){
//   printf("resolve_extern_syms: %s %d\n",str,count);
  print("resolve_extern_syms: "+mk_js_string(str)+" count: "+count);
//   strcpy((char *)global_relocs_table,str);
  strcpy(global_relocs_table,str);
//   global_relocs_table+=strlen(str)+1;
  global_relocs_table+=strlen(str)+1;
//   *(int *)global_relocs_table=count;
  wi32(global_relocs_table,count);
//   global_relocs_table+=4;
  global_relocs_table+=4;
// }
}
//             }
            }
//         }
        }
//         s = s1;
        s = s1;
//     }
    }
// reloc_global=0;
reloc_global=0;
    leave();
// }
}
// 
// int show_help(void)
// {
//     printf("tcc version 0.9.2 - Tiny C Compiler - Copyright (C) 2001 Fabrice Bellard\n"
//            "usage: tcc [-Idir] [-Dsym] [-llib] [-i infile] infile [infile_args...]\n");
//     return 1;
// }
// 
// int r32(int o){
//   int r;
//   r=((int *)(o))[0];
// //  printf("r32: %x\n",r);
//   return r;
// }
// 
// int w32(int o,int v){
// // return 0;
//   *(int *)o=v;
// }
// void gen_obj(int e){
function gen_obj(e){
  enter();
  print("Generating object file\n");
  var f;

  var text_len=alloca(4);
  wi32(text_len,ind-prog);

  var data_len=alloca(4);
  wi32(data_len,glo-glo_base);

  var reloc_len=alloca(4);
  wi32(reloc_len,relocs-relocs_base);

  var global_reloc_len=alloca(4);
  wi32(global_reloc_len,global_relocs-global_relocs_base);

  var global_reloc_table_len=alloca(4);
  wi32(global_reloc_table_len,global_relocs_table-global_relocs_table_base);

  var prog_rel;
  var data_rel;
  var entrypoint=alloca(4);
  wi32(entrypoint,e-prog);

  var m0=alloca(4);
  wi32(m0,0xdeadbe00);

  var m1=alloca(4);
  wi32(m1,0xdeadbe01);

  var m2=alloca(4);
  wi32(m2,0xdeadbe02);

  var m3=alloca(4);
  wi32(m3,0xdeadbe03);

  var m4=alloca(4);
  wi32(m4,0xdeadbe04);

  var i;
  f = fopen(mk_c_string("tcc_boot.o"), mk_c_string("wb"));
  fwrite(entrypoint,1,4,f);
  fwrite(text_len,1,4,f);
  fwrite(data_len,1,4,f);
  fwrite(reloc_len,1,4,f);
  fwrite(global_reloc_len,1,4,f);
  fwrite(global_reloc_table_len,1,4,f);
  fwrite(m0,1,4,f);
  fwrite(global_relocs_table_base,1,ri32(global_reloc_table_len),f);

  prog_rel=malloc(ri32(text_len));
  data_rel=malloc(ri32(data_len));

  memcpy(prog_rel,prog,ri32(text_len));
  memcpy(data_rel,glo_base,ri32(data_len));

  fwrite(m1,1,4,f);
  fwrite(relocs_base,1,ri32(reloc_len),f);

  fwrite(m2,1,4,f);
  fwrite(data_rel,1,ri32(data_len),f);

  fwrite(m3,1,4,f);
  fwrite(global_relocs_base,1,ri32(global_reloc_len),f);

  for(i=0;i<ri32(reloc_len);i=i+12){
    wi32(prog_rel+ri32(relocs_base+i),0); 
  }
  for(i=0;i<ri32(global_reloc_len);i=i+8){
    wi32(prog_rel+ri32(global_relocs_base+i+4),0); 
  }

  fwrite(m4,1,4,f);
  fwrite(prog_rel,1,ri32(text_len),f);
  fclose(f);
  leave();
}
// 
// int prog_rel;
// int data_rel;
// 
// int load_obj(void){
//   printf("Loading object file\n");
//   FILE *f;
//   int text_len;
//   int data_len;
//   int reloc_len;
//   int global_reloc_len;
//   int global_reloc_table_len;
//   int entrypoint;
//   int m0=0xdeadbe00;
//   int m1=0xdeadbe01;
//   int m2=0xdeadbe02;
//   int m3=0xdeadbe03;
//   int m4=0xdeadbe04;
//   int i;
//   int t;
//   f = fopen("tcc_boot.o", "rb");
//   fread(&entrypoint,1,4,f);
//   fread(&text_len,1,4,f);
//   fread(&data_len,1,4,f);
//   fread(&reloc_len,1,4,f);
//   fread(&global_reloc_len,1,4,f);
//   fread(&global_reloc_table_len,1,4,f);
//   fread(&t,1,4,f);
//   if(!(t==m0)){
//     printf("sync m0 %x\n",t);
//     exit(1);
//   }
//   global_relocs_table_base=(int)malloc(global_reloc_table_len);
//   global_relocs_table=global_relocs_table_base;
//   fread((void *)global_relocs_table_base,1,global_reloc_table_len,f);
//   prog_rel=(int)malloc(text_len);
//   data_rel=(int)malloc(data_len);
// 
//   fread(&t,1,4,f);
//   if(!(t==m1)){
//     printf("sync m1 %x\n",t);
//     exit(1);
//   }
//   relocs_base=(int)malloc(reloc_len);
//   fread((void *)relocs_base,1,reloc_len,f);
//   fread(&t,1,4,f);
//   if(!(t==m2)){
//     printf("sync m2 %x\n",t);
//     exit(1);
//   }
// 
//   fread((void *)data_rel,1,data_len,f);
// 
//   fread(&t,1,4,f);
//   if(!(t==m3)){
//     printf("sync m3 %x\n",t);
//     exit(1);
//   }
// 
// 
//   global_relocs_base=(int)malloc(global_reloc_len);
//   fread((void *)global_relocs_base,1,global_reloc_len,f);
// 
//   fread(&t,1,4,f);
//   if(!(t==m4)){
//     printf("sync m4 %x\n",t);
//     exit(1);
//   }
//   fread((void *)prog_rel,1,text_len,f);
//   glo = (int)mmap(NULL, DATA_SIZE,
//               PROT_READ | PROT_WRITE,
//               MAP_PRIVATE | MAP_ANONYMOUS,
//               -1, 0);
//   glo_base=glo;
//   printf("glo: %x %x\n",glo,glo_base);
//   memset((void *)glo, 0, DATA_SIZE);
//   prog = (int)mmap(NULL, TEXT_SIZE,
//               PROT_EXEC | PROT_READ | PROT_WRITE,
//               MAP_PRIVATE | MAP_ANONYMOUS,
//               -1, 0);
//   ind = prog;
//   printf("prog: %x \n",prog);
//   memcpy((char *)prog,(char *)prog_rel,text_len);
//   memcpy((char *)glo_base,(char *)data_rel,data_len);
//   printf("entrypoint: %x\n",(prog+entrypoint));
//   printf("text_len: %x\n",(text_len));
//   printf("data_len: %x\n",(data_len));
//   fclose(f);
// 
//   int m=global_relocs_table_base+global_reloc_table_len;
//   int l;
//   int a;
//   int n;
//   int p;
//   for(i=0;i<reloc_len;i=i+12){
//     if(relocs_base+i+8==0){
//       p=prog;
//     } else {
//       p=glo;
//     }
//     w32(prog+r32(relocs_base+i),r32(relocs_base+i+4)+p); 
//   }
//   int goff=0;
//   int off;
//   int addr;
//   while(global_relocs_table<m){
//     l=strlen((char *)global_relocs_table);
//     a=dlsym(NULL,(char *)global_relocs_table);
//     printf("global_reloc: %s %d %x ",global_relocs_table,l,a);
//     global_relocs_table+=l+1;
//     n=r32(global_relocs_table);
//     global_relocs_table+=4;
//     printf("global_reloc_num: %d\n",n);
//     for(i=0;i<n;i++){
//       off=r32(global_relocs_base+goff+4);
//       addr=(unsigned int)(off+prog);
//       switch(r32(global_relocs_base+goff)) {
//         case RELOC_ADDR32:
//           printf("Reloc type RELOC_ADDR32 at %x\n",addr);
//           *(int *)addr=a;
//           break;
//         case RELOC_REL32:
//           printf("Reloc type RELOC_REL32 at %x\n",addr);
//           *(int *)addr = a - addr - 4;
//           break;
//       }
//       goff=goff+8;
//     }
//   }
//   return prog+entrypoint;
// }
// 
// int main(int argc, char **argv)
// {
function main(argc,argv){
    enter();
//     puts("tcc 1_7 start");
     puts("tcc 1_7 start");
//     Sym *s;
    var s=alloca(4);
//     int (*t)();
    var t=alloca(4);
//     char *p, *r, *outfile;
    var p;
    var r;
    var outfile=alloca(4);
//     int optind;
    var optind;
// 
//     include_paths[0] = "../tcc_1_7/";
    wi32(include_paths,mk_c_string("../tcc_1_7/"));
//     nb_include_paths = 1;
    nb_include_paths = 1;
// 
//     /* add all tokens */
//     tok_ident = TOK_IDENT;
    tok_ident = TOK_IDENT;
//     p = "int\0void\0char\0if\0else\0while\0break\0return\0for\0extern\0static\0unsigned\0goto\0do\0continue\0switch\0case\0const\0volatile\0long\0register\0signed\0auto\0inline\0restrict\0float\0double\0_Bool\0short\0struct\0union\0typedef\0default\0enum\0sizeof\0define\0include\0ifdef\0ifndef\0elif\0endif\0defined\0undef\0error\0line\0__LINE__\0__FILE__\0__DATE__\0__TIME__\0__VA_ARGS__\0__func__\0main\0";
    var p = mk_c_string("int\0void\0char\0if\0else\0while\0break\0return\0for\0extern\0static\0unsigned\0goto\0do\0continue\0switch\0case\0const\0volatile\0long\0register\0signed\0auto\0inline\0restrict\0float\0double\0_Bool\0short\0struct\0union\0typedef\0default\0enum\0sizeof\0define\0include\0ifdef\0ifndef\0elif\0endif\0defined\0undef\0error\0line\0__LINE__\0__FILE__\0__DATE__\0__TIME__\0__VA_ARGS__\0__func__\0main\0");
//     while (*p) {
     while (ri8(p)) {
//         r = p;
         r = p;
//         while (*r++);
         while (c=ri8(r++));
//         tok_alloc(p, r - p - 1);
         tok_alloc(p, r - p - 1);
//         p = r;
         p = r;
//     }
     }
// 
//     /* standard defines */
//     define_symbol("__STDC__");
    define_symbol(mk_c_string("__STDC__"));
//     define_symbol("__i386__");
    define_symbol(mk_c_string("__i386__"));
//     /* tiny C specific defines */
//     define_symbol("__TINYC__");
    define_symbol(mk_c_string("__TINYC__"));
//     
//     glo = (int)mmap(NULL, DATA_SIZE,
//                 PROT_READ | PROT_WRITE,
//                 MAP_PRIVATE | MAP_ANONYMOUS,
//                 -1, 0);
    glo=malloc(DATA_SIZE);
//     glo_base=glo;
    glo_base=glo;
//     printf("glo: %x %x\n",glo,glo_base);
    print("glo: "+to_hex(glo));
//     memset((void *)glo, 0, DATA_SIZE);
    memset(glo, 0, DATA_SIZE);
//     prog = (int)mmap(NULL, TEXT_SIZE,
//                 PROT_EXEC | PROT_READ | PROT_WRITE,
//                 MAP_PRIVATE | MAP_ANONYMOUS,
//                 -1, 0);
    prog=malloc(TEXT_SIZE);
//     ind = prog;
    ind = prog;
//     printf("prog: %x \n",prog);
    print("prog: "+to_hex(prog));
// 
//     optind = 1;
    optind = 1;
//     outfile = NULL;
    outfile = NULL;
// int loader=0;
var loader=0;
//     while (1) {
    while (1) {
// printf("argc %d\n",argc);
print("argc "+argc);
//         if (optind >= argc) {
        if (optind >= argc) {
//         return show_help();
err();
          return show_help();
//         }
         }
//         r = argv[optind];
         r = ri32(argv+(optind*4));
//         if (r[0] != '-')
         if (ri8(r) !== mk_char('-')) {
print("r[0]:"+ri8(r));
//             break;
             break;
         }
//         optind++;
         optind++;
//         if (r[1] == 'I') {
         if (ri8(r+1) === mk_char('I')) {
err();
//             if (nb_include_paths >= INCLUDE_PATHS_MAX)
//                 error("too many include paths");
//             include_paths[nb_include_paths++] = r + 2;
//         } else if (r[1] == 'D') {
         } else if (ri8(r+1) === mk_char('D')) {
err();
//             define_symbol(r + 2);
//         } else if (r[1] == 'i') {
         } else if (ri8(r+1) === mk_char('i')) {
err();
//             if (optind >= argc)
//                 return show_help();
//             tcc_compile_file(argv[optind++]);
//         } else if (r[1] == 'r') {
         } else if (ri8(r+1) === mk_char('r')) {
//             reloc=1;
             reloc=1;
//         } else if (r[1] == 'R') {
         } else if (ri8(r+1) == mk_char('R')) {
err();
//             t=(int (*)())load_obj();
//             loader=1;
//         } else {
         } else {
err();
//             fprintf(stderr, "invalid option -- '%s'\n", r);
//             exit(1);
//         }
         }
//     }
    }
// 
// if(loader){
if(loader){
err();
//   printf("running loader\n");
//   return (*t)(argc - optind, argv + optind);
// }
}
// if(reloc){
if(reloc){
// global_relocs=(int)malloc(64*1024);
global_relocs=malloc(64*1024);
// global_relocs_base=global_relocs;
global_relocs_base=global_relocs;
// 
// printf("global_relocs %d\n",global_relocs);
print("global_relocs "+to_hex(global_relocs));
// 
// global_relocs_table=(int)malloc(64*1024);
global_relocs_table=malloc(64*1024);
// global_relocs_table_base=global_relocs_table;
global_relocs_table_base=global_relocs_table;
// 
// relocs=(int)malloc(64*1024);
relocs=malloc(64*1024);
// relocs_base=relocs;
relocs_base=relocs;
// 
// };
};
// 
//     tcc_compile_file(argv[optind]);
    tcc_compile_file(argv+(4*optind));
//     puts("tcc 1_7 compile done");
    puts("tcc 1_7 compile done");
// 
//     resolve_extern_syms();
    resolve_extern_syms();
//     s = sym_find1(&extern_stack, TOK_MAIN);
    s = sym_find1(extern_stack, TOK_MAIN);
//     if (!s || (s->t & VT_FORWARD))
    if (!s || (ri32(s+Sym_t_o) & VT_FORWARD))
//         error("main() not defined");
        error("main() not defined");
// 
print("main: "+to_hex(ri32(s+Sym_c_o)));
// if(reloc){
if(reloc){
//   gen_obj(s->c);
  gen_obj(ri32(s+Sym_c_o));
// }
}
// 
// ljw don't need this bit as we don't call the code
//     t = (int (*)())s->c;
//     return (*t)(argc - optind, argv + optind);
// }
    return leave();
}
