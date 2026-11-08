import {Q1} from './districts/q1';
const CONTENT = [
{id:'q1-network-01',short:'Желі',name:'Желі орталығы',place:'Желі орталығы',color:'#339ac5',goal:'Компьютерлерді коммутаторға, коммутаторды маршрутизаторға жалға. Ажыратылған кабельді тап.'},
{id:'future-components',short:'Құрылғылар',name:'Байланыс шеберханасы',color:'#30a993',goal:'Кейін: желі компоненттері.'},
{id:'future-ip',short:'IP',name:'IP пошта бөлімі',color:'#648bd4',goal:'Кейін: IP мекенжайлары.'},
{id:'future-dns',short:'DNS',name:'DNS анықтама орталығы',color:'#a382d5',goal:'Кейін: атаулар мен мекенжайлар.'},
{id:'future-security',short:'Қауіпсіздік',name:'Қауіпсіздік бекеті',color:'#e07d61',goal:'Кейін: желідегі қауіпсіздік.'},
{id:'future-crypto',short:'Шифрлау',name:'Ақпаратты қорғау зертханасы',color:'#e6b331',goal:'Кейін: ақпаратты қорғау.'},
{id:'future-auth',short:'Кіру',name:'Кіру қақпасы',color:'#5caaa5',goal:'Кейін: идентификация және аутентификация.'},
{id:'future-district',short:'Жаңа аудан',name:'Жылдық курс ауданы',color:'#6388bb',goal:'Мазмұны материалдарды түгендегеннен кейін бекітіледі.'}
];

export const LESSONS=CONTENT.map((lesson,index)=>({...lesson,...Q1.stations[index]}));
