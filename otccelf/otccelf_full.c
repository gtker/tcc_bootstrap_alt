int e,C,J,m,vars,U, prog, ind,P, glo,file, sym_stk, dstk,V,al,Z, data,R,data_offset;

L(a){
  *(char*) dstk++=a;
}

inp (){
  if(V){
    m=*(char*) V++;
    if( m == 2){
      V=0;
      m=al;
    }
  }
    else m=fgetc(file);
}

am (){
  return isalnum(m)|m == 95;
}

an (){
  if( m == 92){
    inp ();
    if( m == 110)m=10;
  }
}

next(){
  int a,s,h;
  while( isspace(m)|m == 35){
    if( m == 35){
      inp ();
      next();
      if( e == 536){
        next();
        L(32);
        *(int*) e=1;
        *(int*)(e+4)=dstk;
      }
      while( m!=10){
        L(m);
        inp ();
      }
      L(m);
      L(2);
    }
    inp ();
  }
  J=0;
  e=m;
  if( am ()){
    L(32);
    Z=dstk;
    while( am ()){
      L(m);
      inp ();
    }
    if( isdigit(e)){
      C=strtol(Z,0,0);
      e=2;
    }
    else{
      *(char*) dstk=32;
      e=strstr(sym_stk,Z-1)-sym_stk;
      *(char*) dstk=0;
      e=e*8+256;
      if( e>536){
        e=vars+e;
        if( *(int*) e == 1){
          V=*(int*)(e+4);
          al=m;
          inp ();
          next();
        }
      }
    }
  }
  else{
    inp ();
    if( e == 39){
      e=2;
      an ();
      C=m;
      inp ();
      inp ();
    }
    else if( e == 47&m == 42){
      inp ();
      while( m){
        while( m!=42)inp ();
        inp ();
        if( m == 47)m=0;
      }
      inp ();
      next();
    }
    else{
      a="++#m--%am*@R<^1c/@%[_[H3c%@%[_[H3c+@.B#d-@%:_^BKd<<Z/03e>>`/03e<=0f>=/f<@.f>@1f==&g!='g&&k||#l&@.BCh^@.BSi|@.B+j~@/%Yd!@&d*@b";
      while( s=*(char*) a++){
        h=*(char*) a++;
        C=0;
        while((J=*(char*) a++-98)<0) C=C*64+J+64;
        if( s == e&(h == m|h == 64)){
          if( h == m){
            inp ();
            e=1;
          }
          break;
        }
      }
    }
  }
}

aw( d){
  while( d&&d!=-1){
    *(char*) ind++=d;
    d=d>>8;
  }
}

E(a,d){
  *(char*) a++=d;
  *(char*) a++=d>>8;
  *(char*) a++=d>>16;
  *(char*) a++=d>>24;
}

ao(a){
  int d;
  return(*(char*) a&255)|(*(char*)(a+1)&255)<<8|(*(char*)(a+2)&255)<<16|(*(char*)(a+3)&255)<<24;
}

ap(a,z){
  int d;
  while( a){
    d=ao(a);
    if( *(char*)(a-1) == 5){
      if( z>=data&&z<glo)E(a,z+data_offset);
      else E(a,z-prog+R+data_offset);
    }
    else{
      E(a,z-a-4);
    }
    a=d;
  }
}

H(a){
  ap(a,ind);
}

x(d,a){
  aw( d);
  E(ind,a);
  a=ind;
  ind=ind+4;
  return a;
}

M(a){
  x(184,a);
}

I(a){
  return x(233,a);
}

aa(s,a){
  aw( 1032325);
  return x(132+s,a);
}

aq(a){
  aw( 49465);
  M(0);
  aw( 15);
  aw( a+144);
  aw( 192);
}

W(s,a){
  int d;
  aw( s+131);
  d=*(int*) a;
  if( d&&d<512)x(133,d);
  else{
    a=a+4;
    *(int*) a=x(5,*(int*) a);
  }
}

ab(s){
  int d,a,h,F;
  d=1;
  if( e == 34){
    M(glo+data_offset);
    while( m!=34){
      an ();
      *(char*) glo++=m;
      inp ();
    }
    *(char*) glo=0;
    glo=glo+4&-4;
    inp ();
    next();
  }
  else{
    F=J;
    h=C;
    a=e;
    next();
    if( a == 2){
      M(h);
    }
    else if( F == 2){
      ab(0);
      x(185,0);
      if( a == 33)aq(h);
      else aw( h);
    }
    else if( a == 40){
      B ();
      next();
    }
    else if( a == 42){
      next();
      a=e;
      next();
      next();
      if( e == 42){
        next();
        next();
        next();
        next();
        a=0;
      }
      next();
      ab(0);
      if( e == 61){
        next();
        aw( 80);
        B ();
        aw( 89);
        aw( 392+(a == 256));
      }
      else if( a){
        if( a == 256)aw( 139);
        else aw( 48655);
        ind++;
      }
    }
    else if( a == 38){
      W(10,e);
      next();
    }
    else{
      d=0;
      if( e == 61&s){
        next();
        B ();
        W(6,a);
      }
      else if( e!=40){
        W(8,a);
        if( J == 11){
          W(0,a);
          aw( C);
          next();
        }
      }
    }
  }
  if( e == 40){
    if( d)aw( 80);
    h=x(60545,0);
    next();
    s=0;
    while( e!=41){
      B ();
      x(2393225,s);
      if( e == 44)next();
      s=s+4;
    }
    E(h,s);
    next();
    if( d){
      x(2397439,s);
      s=s+4;
    }
    else{
      a=a+4;
      *(int*) a=x(232,*(int*) a);
    }
    if( s) x(50305,s);
  }
}

X(s){
  int a,d,h;
  if( s--== 1) ab(1);
  else{
    X(s);
    h=0;
    while( s == J){
      d=e;
      a=C;
      next();
      if( s>8){
        h=aa(a,h);
        X(s);
      }
      else{
        aw( 80);
        X(s);
        aw( 89);
        if( s == 4|s == 5){
          aq(a);
        }
        else{
          aw( a);
          if( d == 37)aw( 146);
        }
      }
    }
    if( h&&s>8){
      h=aa(a,h);
      M(a^1);
      I(5);
      H(h);
      M(a);
    }
  }
}

B (){
  X(11);
}

ac (){
  B ();
  return aa(0,0);
}

S(s){
  int h,d,a;
  if( e == 288){
    next();
    next();
    h=ac ();
    next();
    S(s);
    if( e == 312){
      next();
      d=I(0);
      H(h);
      S(s);
      H(d);
    }
    else{
      H(h);
    }
  }
  else if( e == 352|e == 504){
    a=e;
    next();
    next();
    if( a == 352){
      d=ind;
      h=ac ();
    }
    else{
      if( e!=59)B ();
      next();
      d=ind;
      h=0;
      if( e!=59)h=ac ();
      next();
      if( e!=41){
        a=I(0);
        B ();
        I(d-ind-5);
        H(a);
        d=a+4;
      }
    }
    next();
    S(&h);
    I(d-ind-5);
    H(h);
  }
  else if( e == 123){
    next();
    decl(1);
    while( e!=125)S(s);
    next();
  }
  else{
    if( e == 448){
      next();
      if( e!=59)B ();
      U=I(U);
    }
    else if( e == 400){
      next();
      *(int*) s=I(*(int*) s);
    }
    else if( e!=59)B ();
    next();
  }
}

decl(s){
  int h;
  while( e == 256|e!=-1&!s){
    if( e == 256){
      next();
      while( e!=59){
        if( s){
          P=P+4;
          *(int*) e=-P;
        }
        else{
          *(int*) e=glo;
          glo=glo+4;
        }
        next();
        if( e == 44)next();
      }
      next();
    }
    else{
      *(int*) e=ind;
      next();
      next();
      h=8;
      while( e!=41){
        *(int*) e=h;
        h=h+4;
        next();
        if( e == 44)next();
      }
      next();
      U=P=0;
      aw( 15042901);
      h=x(60545,0);
      S(0);
      H(U);
      aw( 50121);
      E(h,P);
    }
  }
}

gle32( d){
  E(glo,d);
  glo=glo+4;
}

ad(d,a){
  gle32( d);
  d=d+134512640;
  gle32( d);
  gle32( d);
  gle32( a);
  gle32( a);
}

ae(s){
  int a,h,d,N,z,F;
  N=0;
  a=sym_stk;
  while( 1){
    a++;
    h=a;
    while( *(char*) a!=32&&a<dstk)a++;
    if( a == dstk)break;
    e=vars+(h-sym_stk)*8+256-8;
    z=*(int*) e;
    d=*(int*)(e+4);
    if( d&&z!=1){
      if(!z){
        if(!s){
          memcpy(glo,h,a-h);
          glo=glo+a-h+1;
        }
        else if( s == 1){
          gle32( N+22);
          gle32( 0);
          gle32( 0);
          gle32( 16);
          N=N+a-h+1;
        }
        else{
          N++;
          while( d){
            h=ao(d);
            F=*(char*)(d-1)!=5;
            E(d,-F*4);
            gle32( d-prog+R+data_offset);
            gle32( N*256+F+1);
            d=h;
          }
        }
      }
      else if(!s){
        ap(d,z);
      }
    }
  }
}

elf_out(c){
  int glo_saved, dynstr, dynstr_size, dynsym, hash, rel, n, t, text_size;
  R=glo;
  text_size=ind-prog;
  ind=prog;
  aw( 5264472);
  t=*(int*)(vars+592);
  x(232,t-ind-5);
  aw( 50057);
  M(1);
  aw( 32973);
  glo=glo+text_size;
  dynstr=glo;
  glo++;
  glo=strcpy(glo,"libc.so.6")+10;
  glo=strcpy(glo,"libdl.so.2")+11;
  ae(0);
  dynstr_size=glo-dynstr;
  glo=(glo+3)&-4;
  dynsym=glo;
  gle32( 0);
  gle32( 0);
  gle32( 0);
  gle32( 0);
  ae(1);
  hash=glo;
  n=(glo-dynsym)/16;
  gle32( 1);
  gle32( n);
  gle32( 1);
  gle32( 0);
  t=2;
  while( t<n)gle32( t++);
  gle32( 0);
  rel=glo;
  ae(2);
  memcpy(R,prog,text_size);
  glo_saved=glo;
  glo=data;
  gle32( 1179403647);
  gle32( 65793);
  gle32( 0);
  gle32( 0);
  gle32( 196610);
  gle32( 1);
  gle32( R+data_offset);
  gle32( 48);
  gle32( 0);
  gle32( 0);
  gle32( 2097204);
  gle32( 3);
  gle32( 3);
  ad(144,19);
  gle32( 4);
  gle32( 1);
  gle32( 1);
  ad(0,glo_saved-data);
  gle32( 7);
  gle32( 4096);
  gle32( 2);
  ad(164,88);
  gle32( 6);
  gle32( 4);
  glo=strcpy(glo,"/lib/ld-linux.so.2")+20;
  gle32( 1);
  gle32( 1);
  gle32( 1);
  gle32( 11);
  gle32( 4);
  gle32( hash+data_offset);
  gle32( 6);
  gle32( dynsym+data_offset);
  gle32( 5);
  gle32( dynstr+data_offset);
  gle32( 10);
  gle32( dynstr_size);
  gle32( 11);
  gle32( 16);
  gle32( 17);
  gle32( rel+data_offset);
  gle32( 18);
  gle32( glo_saved-rel);
  gle32( 19);
  gle32( 8);
  gle32( 0);
  gle32( 0);
  t=fopen(c,"w");
  fwrite(data,1,glo_saved-data,t);
  fclose(t);
}

main(n,t){
  if( n<3){
    printf("usage: otccelf file.c outfile\n");
    return 0;
  }
  dstk=strcpy(sym_stk = calloc(1,99999),
              " int if else while break return for define main ")+48;
  glo = data = calloc(1,99999);
  ind = prog = calloc(1,99999);
  vars = calloc(1,99999);

  t = t + 4;
  file=fopen(*(int*)t, "r");

  data_offset=134512640-data;
  glo=glo+252;
  ind=ind+17;

  inp();
  next();
  decl(0);
  t = t + 4;
  elf_out(*(int*)t);
  return 0;
}
