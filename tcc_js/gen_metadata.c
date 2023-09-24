#define main main_orig

#include "tcc.c"

#undef main

int main(void){
  printf("// use gen_metadata.c to create\n");
  printf("var TOK_IDENT=0x%x;\n",TOK_IDENT);
  printf("var SYM_FIRST_ANOM=0x%x;\n",SYM_FIRST_ANOM);
  printf("var TokenSym_size=0x%x;\n",sizeof(TokenSym));
  printf("var Reloc_size=0x%x;\n",sizeof(Reloc));
  printf("var CValue_size=0x%x;\n",sizeof(CValue));
  printf("var GFuncContext_size=0x%x;\n",sizeof(GFuncContext));
  printf("var TOK_NUM=0x%x;\n",TOK_NUM);
  printf("var TOK_CCHAR=0x%x;\n",TOK_CCHAR);
  printf("var TOK_LCHAR=0x%x;\n",TOK_LCHAR);
  printf("var TOK_STR=0x%x;\n",TOK_STR);
  printf("var TOK_LSTR=0x%x;\n",TOK_LSTR);
  printf("var TOK_CFLOAT=0x%x;\n",TOK_CFLOAT);
  printf("var TOK_CDOUBLE=0x%x;\n",TOK_CDOUBLE);
  printf("var TOK_CHAR=0x%x;\n",TOK_CHAR);
  printf("var TOK_VOID=0x%x;\n",TOK_VOID);
  printf("var TOK_SHORT=0x%x;\n",TOK_SHORT);
  printf("var TOK_INT=0x%x;\n",TOK_INT);
  printf("var TOK_ENUM=0x%x;\n",TOK_ENUM);
  printf("var TOK_STRUCT=0x%x;\n",TOK_STRUCT);
  printf("var TOK_UNION=0x%x;\n",TOK_UNION);
  printf("var TOK_CONST=0x%x;\n",TOK_CONST);
  printf("var TOK_VOLATILE=0x%x;\n",TOK_VOLATILE);
  printf("var TOK_REGISTER=0x%x;\n",TOK_REGISTER);
  printf("var TOK_SIGNED=0x%x;\n",TOK_SIGNED);
  printf("var TOK_AUTO=0x%x;\n",TOK_AUTO);
  printf("var TOK_INLINE=0x%x;\n",TOK_INLINE);
  printf("var TOK_RESTRICT=0x%x;\n",TOK_RESTRICT);
  printf("var TOK_UNSIGNED=0x%x;\n",TOK_UNSIGNED);
  printf("var TOK_EXTERN=0x%x;\n",TOK_EXTERN);
  printf("var TOK_STATIC=0x%x;\n",TOK_STATIC);
  printf("var TOK_TYPEDEF=0x%x;\n",TOK_TYPEDEF);
  printf("var SymStack_size=0x%x;\n",sizeof(SymStack));
  printf("var Sym_size=0x%x;\n",sizeof(Sym));
  printf("var IncludeFile_size=0x%x;\n",sizeof(IncludeFile));
  printf("var SValue_size=0x%x;\n",sizeof(SValue));
  printf("var VT_BTYPE=0x%x;\n",VT_BTYPE);
  printf("var VT_ENUM=0x%x;\n",VT_ENUM);
  printf("var VT_STRUCT=0x%x;\n",VT_STRUCT);
  printf("var VT_VOID=0x%x;\n",VT_VOID);
  printf("var VT_TYPEDEF=0x%x;\n",VT_TYPEDEF);
  printf("var VT_STATIC=0x%x;\n",VT_STATIC);
  printf("var VT_EXTERN=0x%x;\n",VT_EXTERN);
  printf("var VT_FUNC=0x%x;\n",VT_FUNC);
  printf("var VT_STRUCT_SHIFT=0x%x;\n",VT_STRUCT_SHIFT);
  printf("var VT_LOCAL=0x%x;\n",VT_LOCAL);
  printf("var TOK_IF=0x%x;\n",TOK_IF);
  printf("var TOK_WHILE=0x%x;\n",TOK_WHILE);
  printf("var TOK_RETURN=0x%x;\n",TOK_RETURN);
  printf("var TOK_SHL=0x%x;\n",TOK_SHL);
  printf("var TOK_SAR=0x%x;\n",TOK_SAR);
  printf("var TOK_ULE=0x%x;\n",TOK_ULE);
  printf("var TOK_GT=0x%x;\n",TOK_GT);
  printf("var TOK_ULT=0x%x;\n",TOK_ULT);
  printf("var TOK_UGE=0x%x;\n",TOK_UGE);
  printf("var TOK_EQ=0x%x;\n",TOK_EQ);
  printf("var TOK_NE=0x%x;\n",TOK_NE);
  printf("var TOK_LAND=0x%x;\n",TOK_LAND);
  printf("var TOK_LOR=0x%x;\n",TOK_LOR);
  printf("var TOK_INC=0x%x;\n",TOK_INC);
  printf("var TOK_DEC=0x%x;\n",TOK_DEC);
  printf("var TOK_ARROW=0x%x;\n",TOK_ARROW);
  printf("var TOK_A_MOD=0x%x;\n",TOK_A_MOD);
  printf("var TOK_A_XOR=0x%x;\n",TOK_A_XOR);
  printf("var TOK_A_OR=0x%x;\n",TOK_A_OR);
  printf("var TOK_A_SHL=0x%x;\n",TOK_A_SHL);
  printf("var TOK_A_SAR=0x%x;\n",TOK_A_SAR);
  printf("var TOK_DEFINE=0x%x;\n",TOK_DEFINE);
  printf("var VT_INT=0x%x;\n",VT_INT);
  printf("var VT_CMP=0x%x;\n",VT_CMP);
  printf("var VT_FORWARD=0x%x;\n",VT_FORWARD);
  printf("var VT_TYPE=0x%x;\n",VT_TYPE);
  printf("var VT_ARRAY=0x%x;\n",VT_ARRAY);
  printf("var VT_PTR=0x%x;\n",VT_PTR);
  printf("var SYM_FIELD=0x%x;\n",SYM_FIELD);
  printf("var SYM_STRUCT=0x%x;\n",SYM_STRUCT);
  printf("var TOK_MAIN=0x%x;\n",TOK_MAIN);
  printf("var VT_LLOCAL=0x%x;\n",VT_LLOCAL);
  printf("var VT_SHORT=0x%x;\n",VT_SHORT);
  printf("var VT_BYTE=0x%x;\n",VT_BYTE);
  printf("var VT_UNSIGNED=0x%x;\n",VT_UNSIGNED);
  printf("var VT_JMP=0x%x;\n",VT_JMP);
  printf("var VT_JMPI=0x%x;\n",VT_JMPI);
  printf("var VT_FLOAT=0x%x;\n",VT_FLOAT);
  printf("var TOK___FUNC__=0x%x;\n",TOK___FUNC__);
  printf("var TOK_SIZEOF=0x%x;\n",TOK_SIZEOF);
  printf("var TOK_BREAK=0x%x;\n",TOK_BREAK);
  printf("var TOK_CONTINUE=0x%x;\n",TOK_CONTINUE);
  printf("var TOK_DO=0x%x;\n",TOK_DO);
  printf("var TOK_SWITCH=0x%x;\n",TOK_SWITCH);
  printf("var TOK_CASE=0x%x;\n",TOK_CASE);
  printf("var TOK_DEFAULT=0x%x;\n",TOK_DEFAULT);
  printf("var TOK_UNDEF=0x%x;\n",TOK_UNDEF);
  printf("var TOK_INCLUDE=0x%x;\n",TOK_INCLUDE);
  printf("var TOK_ERROR=0x%x;\n",TOK_ERROR);
  printf("var TOK_DOTS=0x%x;\n",TOK_DOTS);
  printf("var TOK_UDIV=0x%x;\n",TOK_UDIV);
  printf("var TOK_PDIV=0x%x;\n",TOK_PDIV);
  printf("var TOK_MID=0x%x;\n",TOK_MID);
  printf("var TOK_SHR=0x%x;\n",TOK_SHR);
  printf("var TOK_UMOD=0x%x;\n",TOK_UMOD);
  printf("var TOK_ELSE=0x%x;\n",TOK_ELSE);
  printf("var TOK_LT=0x%x;\n",TOK_LT);
  printf("var TOK_FOR=0x%x;\n",TOK_FOR);
  printf("var TOK_SHL=0x%x;\n",TOK_SHL);
  printf("var VT_LVALN=0x%x;\n",VT_LVALN);
  printf("var TOK_LE=0x%x;\n",TOK_LE);
  printf("var TOK_GE=0x%x;\n",TOK_GE);
  printf("var TOK_A_DIV=0x%x;\n",TOK_A_DIV);
  printf("var TOK_UGT=0x%x;\n",TOK_UGT);
  return 0;
}
