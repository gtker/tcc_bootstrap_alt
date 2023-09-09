// use gen_metadata.c to create
var TOK_IDENT=0x100;
var SYM_FIRST_ANOM=0x8000;
var TokenSym_size=0x10;
var Reloc_size=0xc;
var CValue_size=0x4;
var GFuncContext_size=0x4;
var TOK_NUM=0xb3;
var TOK_CCHAR=0xb4;
var TOK_LCHAR=0xb7;
var TOK_STR=0xb5;
var TOK_LSTR=0xb8;
var TOK_CFLOAT=0xb9;
var TOK_CDOUBLE=0xc0;
var TOK_CHAR=0x102;
var TOK_VOID=0x101;
var TOK_SHORT=0x11c;
var TOK_INT=0x100;
var TOK_ENUM=0x121;
var TOK_STRUCT=0x11d;
var TOK_UNION=0x11e;
var TOK_CONST=0x111;
var TOK_VOLATILE=0x112;
var TOK_REGISTER=0x114;
var TOK_SIGNED=0x115;
var TOK_AUTO=0x116;
var TOK_INLINE=0x117;
var TOK_RESTRICT=0x118;
var TOK_UNSIGNED=0x10b;
var TOK_EXTERN=0x109;
var TOK_STATIC=0x10a;
var TOK_TYPEDEF=0x11f;
var SymStack_size=0x420;
var Sym_size=0x18;
var IncludeFile_size=0xc;
var SValue_size=0x8;
var VT_BTYPE=0x1e00;
var VT_ENUM=0xa00;
var VT_STRUCT=0xe00;
var VT_VOID=0x600;
var VT_TYPEDEF=0x100;
var VT_STATIC=0x80;
var VT_EXTERN=0x40;
var VT_FUNC=0xc00;
var VT_STRUCT_SHIFT=0x10;
var VT_LOCAL=0xc;
var TOK_IF=0x103;
var TOK_WHILE=0x105;
var TOK_RETURN=0x107;
var TOK_SHL=0x1;
var TOK_SAR=0x2;
var TOK_ULE=0x96;
var TOK_GT=0x9f;
var TOK_ULT=0x92;
var TOK_UGE=0x93;
var TOK_EQ=0x94;
var TOK_NE=0x95;
var TOK_LAND=0xa0;
var TOK_LOR=0xa1;
var TOK_INC=0xa4;
var TOK_DEC=0xa2;
var TOK_ARROW=0xa7;
var TOK_A_MOD=0xa5;
var TOK_A_XOR=0xde;
var TOK_A_OR=0xfc;
var TOK_A_SHL=0x81;
var TOK_A_SAR=0x82;
var TOK_DEFINE=0x123;
var VT_INT=0x0;
var VT_CMP=0xd;
var VT_FORWARD=0x20;
var VT_TYPE=0xfffffe00;
var VT_ARRAY=0x4000;
var VT_PTR=0x800;
var SYM_FIELD=0x20000000;
var SYM_STRUCT=0x40000000;
var TOK_MAIN=0x133;
var VT_LLOCAL=0xb;
var VT_SHORT=0x400;
var VT_BYTE=0x200;
var VT_UNSIGNED=0x2000;
var VT_JMP=0xe;
var VT_JMPI=0xf;
var VT_FLOAT=0x1000;
var TOK___FUNC__=0x132;
var TOK_SIZEOF=0x122;
var TOK_BREAK=0x106;
var TOK_CONTINUE=0x10e;
var TOK_DO=0x10d;
var TOK_SWITCH=0x10f;
var TOK_CASE=0x110;
var TOK_DEFAULT=0x120;
var TOK_UNDEF=0x12a;
var TOK_INCLUDE=0x124;
var TOK_ERROR=0x12b;
var TOK_DOTS=0xa8;
var TOK_UDIV=0xb0;
var TOK_PDIV=0xb2;
var TOK_MID=0xa3;
var TOK_SHR=0xa9;
var TOK_UMOD=0xb1;
