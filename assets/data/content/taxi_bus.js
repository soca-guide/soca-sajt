window.APP_DATA = window.APP_DATA || {};
window.APP_DATA.taxiBus = {
  taxiServices: [
    { name: 'So\u010da Taxi Express',   phone: '+386 30 123 456', tel: 'tel:+38630123456' },
    { name: 'Kanin Ride',             phone: '+386 31 234 567', tel: 'tel:+38631234567' },
    { name: 'Bovec QuickCab',         phone: '+386 40 345 678', tel: 'tel:+38640345678' },
    { name: 'Emerald Valley Taxi',    phone: '+386 51 567 890', tel: 'tel:+38651567890' }
  ],
  originNames: {
    tolmin:    { sl: 'Tolmin',    en: 'Tolmin',    de: 'Tolmin',    it: 'Tolmin'    },
    kobarid:   { sl: 'Kobarid',   en: 'Kobarid',   de: 'Kobarid',   it: 'Kobarid'   },
    srpenica:  { sl: 'Srpenica',  en: 'Srpenica',  de: 'Srpenica',  it: 'Srpenica'  },
    zaga:      { sl: '\u017daga', en: '\u017daga', de: '\u017daga', it: '\u017daga' },
    bovec:     { sl: 'Bovec',     en: 'Bovec',     de: 'Bovec',     it: 'Bovec'     },
    'cezso\u010da': { sl: '\u010cezso\u010da', en: '\u010cezso\u010da', de: '\u010cezso\u010da', it: '\u010cezso\u010da' }
  },
  originOrder: ['tolmin', 'kobarid', 'srpenica', 'zaga', 'bovec', 'cezso\u010da'],
  destinations: [
    { key: 'bovec',       labelKey: 'quick_help_route_to_bovec'       },
    { key: 'tolmin',      labelKey: 'quick_help_route_to_tolmin'      },
    { key: 'kobarid',     labelKey: 'quick_help_route_to_kobarid'     },
    { key: 'most',        labelKey: 'quick_help_route_to_most'        },
    { key: 'nova_gorica', labelKey: 'quick_help_route_to_nova_gorica' },
    { key: 'ljubljana',   labelKey: 'quick_help_route_to_ljubljana'   }
  ],
  routeUrls: {
    tolmin: {
      bovec:       'https://www.google.com/maps/dir/?api=1&origin=Tolmin%2C%20Slovenia&destination=Bovec%20bus%20station%2C%20Slovenia',
      kobarid:     'https://www.google.com/maps/dir/?api=1&origin=Tolmin%2C%20Slovenia&destination=Kobarid%2C%20Slovenia',
      most:        'https://www.google.com/maps/dir/?api=1&origin=Tolmin%2C%20Slovenia&destination=Most%20na%20So%C4%8Di%20train%20station%2C%20Slovenia',
      nova_gorica: 'https://www.google.com/maps/dir/?api=1&origin=Tolmin%2C%20Slovenia&destination=Nova%20Gorica%2C%20Slovenia',
      ljubljana:   'https://www.google.com/maps/dir/?api=1&origin=Tolmin%2C%20Slovenia&destination=Ljubljana%2C%20Slovenia'
    },
    kobarid: {
      bovec:       'https://www.google.com/maps/dir/?api=1&origin=Kobarid%2C%20Slovenia&destination=Bovec%20bus%20station%2C%20Slovenia',
      tolmin:      'https://www.google.com/maps/dir/?api=1&origin=Kobarid%2C%20Slovenia&destination=Tolmin%2C%20Slovenia',
      most:        'https://www.google.com/maps/dir/?api=1&origin=Kobarid%2C%20Slovenia&destination=Most%20na%20So%C4%8Di%20train%20station%2C%20Slovenia',
      nova_gorica: 'https://www.google.com/maps/dir/?api=1&origin=Kobarid%2C%20Slovenia&destination=Nova%20Gorica%2C%20Slovenia',
      ljubljana:   'https://www.google.com/maps/dir/?api=1&origin=Kobarid%2C%20Slovenia&destination=Ljubljana%2C%20Slovenia'
    },
    srpenica: {
      bovec:       'https://www.google.com/maps/dir/?api=1&origin=Srpenica%2C%20Slovenia&destination=Bovec%20bus%20station%2C%20Slovenia',
      tolmin:      'https://www.google.com/maps/dir/?api=1&origin=Srpenica%2C%20Slovenia&destination=Tolmin%2C%20Slovenia',
      kobarid:     'https://www.google.com/maps/dir/?api=1&origin=Srpenica%2C%20Slovenia&destination=Kobarid%2C%20Slovenia',
      most:        'https://www.google.com/maps/dir/?api=1&origin=Srpenica%2C%20Slovenia&destination=Most%20na%20So%C4%8Di%20train%20station%2C%20Slovenia',
      nova_gorica: 'https://www.google.com/maps/dir/?api=1&origin=Srpenica%2C%20Slovenia&destination=Nova%20Gorica%2C%20Slovenia',
      ljubljana:   'https://www.google.com/maps/dir/?api=1&origin=Srpenica%2C%20Slovenia&destination=Ljubljana%2C%20Slovenia'
    },
    zaga: {
      bovec:       'https://www.google.com/maps/dir/?api=1&origin=%C5%BDaga%2C%20Slovenia&destination=Bovec%20bus%20station%2C%20Slovenia',
      tolmin:      'https://www.google.com/maps/dir/?api=1&origin=%C5%BDaga%2C%20Slovenia&destination=Tolmin%2C%20Slovenia',
      kobarid:     'https://www.google.com/maps/dir/?api=1&origin=%C5%BDaga%2C%20Slovenia&destination=Kobarid%2C%20Slovenia',
      most:        'https://www.google.com/maps/dir/?api=1&origin=%C5%BDaga%2C%20Slovenia&destination=Most%20na%20So%C4%8Di%20train%20station%2C%20Slovenia',
      nova_gorica: 'https://www.google.com/maps/dir/?api=1&origin=%C5%BDaga%2C%20Slovenia&destination=Nova%20Gorica%2C%20Slovenia',
      ljubljana:   'https://www.google.com/maps/dir/?api=1&origin=%C5%BDaga%2C%20Slovenia&destination=Ljubljana%2C%20Slovenia'
    },
    bovec: {
      tolmin:      'https://www.google.com/maps/dir/?api=1&origin=Bovec%20bus%20station%2C%20Slovenia&destination=Tolmin%2C%20Slovenia',
      kobarid:     'https://www.google.com/maps/dir/?api=1&origin=Bovec%20bus%20station%2C%20Slovenia&destination=Kobarid%2C%20Slovenia',
      most:        'https://www.google.com/maps/dir/?api=1&origin=Bovec%20bus%20station%2C%20Slovenia&destination=Most%20na%20So%C4%8Di%20train%20station%2C%20Slovenia',
      nova_gorica: 'https://www.google.com/maps/dir/?api=1&origin=Bovec%20bus%20station%2C%20Slovenia&destination=Nova%20Gorica%2C%20Slovenia',
      ljubljana:   'https://www.google.com/maps/dir/?api=1&origin=Bovec%20bus%20station%2C%20Slovenia&destination=Ljubljana%2C%20Slovenia'
    },
    'cezso\u010da': {
      bovec:       'https://www.google.com/maps/dir/?api=1&origin=%C4%8Cezso%C4%8Da%2C%20Slovenia&destination=Bovec%20bus%20station%2C%20Slovenia',
      tolmin:      'https://www.google.com/maps/dir/?api=1&origin=%C4%8Cezso%C4%8Da%2C%20Slovenia&destination=Tolmin%2C%20Slovenia',
      kobarid:     'https://www.google.com/maps/dir/?api=1&origin=%C4%8Cezso%C4%8Da%2C%20Slovenia&destination=Kobarid%2C%20Slovenia',
      most:        'https://www.google.com/maps/dir/?api=1&origin=%C4%8Cezso%C4%8Da%2C%20Slovenia&destination=Most%20na%20So%C4%8Di%20train%20station%2C%20Slovenia',
      nova_gorica: 'https://www.google.com/maps/dir/?api=1&origin=%C4%8Cezso%C4%8Da%2C%20Slovenia&destination=Nova%20Gorica%2C%20Slovenia',
      ljubljana:   'https://www.google.com/maps/dir/?api=1&origin=%C4%8Cezso%C4%8Da%2C%20Slovenia&destination=Ljubljana%2C%20Slovenia'
    }
  }
};
