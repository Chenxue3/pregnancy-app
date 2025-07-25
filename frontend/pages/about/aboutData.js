// Pregnancy Support Services Data for About Page

export const regions = [
  'Auckland',
  'Bay of Plenty',
  'Canterbury',
  'Capital & Coast',
  'Counties Manukau',
  'Hawke\'s Bay',
  'Hutt Valley',
  'Lakes',
  'MidCentral',
  'Nelson Marlborough',
  'Northland',
  'South Canterbury',
  'Southern',
  'Tairawhiti',
  'Taranaki',
  'Waikato',
  'Wairarapa',
  'Waitemata',
  'West Coast',
  'Whanganui'
];

export const regionalServices = {
  'Auckland': [
    'Auckland City Hospital Maternity Services',
    'National Women\'s Health - Auckland City Hospital',
    'Birthcare Auckland',
    'Auckland Regional Pain Management'
  ],
  'Canterbury': [
    'Christchurch Women\'s Hospital',
    'Canterbury District Health Board Maternity',
    'Pegasus Health Maternity Services'
  ],
  'Capital & Coast': [
    'Wellington Hospital Maternity Unit',
    'Kenepuru Maternity Unit',
    'Capital & Coast DHB Community Midwives'
  ],
  'Counties Manukau': [
    'Middlemore Hospital Maternity',
    'Counties Manukau Health Maternity Services',
    'Pukekohe Maternity Unit'
  ],
  'Waikato': [
    'Waikato Hospital Maternity Unit',
    'Te Awamutu Maternity Unit',
    'Thames Maternity Unit'
  ]

};

export const serviceSections = [
  {
    key: 'general',
    icon: 'mdi-account-group',
    color: 'success',
    title: 'For Everyone Pregnant',
    description: 'Services that help you navigate pregnancy and connect with appropriate care:',
    regional: true
  },
  {
    key: 'specialist',
    icon: 'mdi-medical-bag',
    color: 'warning',
    title: 'Specialist Support Services',
    items: [
      {
        icon: 'mdi-brain',
        color: 'accent',
        title: 'Mental Health Support Services',
        description: 'Specialized mental health support during pregnancy:',
        list: [
          'Perinatal mental health services',
          'Counselling and therapy services',
          'Support groups for pregnant mothers',
          'Crisis intervention services',
          'Postnatal depression and anxiety support'
        ]
      },
      {
        icon: 'mdi-alert-circle-outline',
        color: 'info',
        title: 'Pregnancy Complications Support',
        description: 'Support for various pregnancy complications and concerns:',
        list: [
          'High-risk pregnancy management',
          'Fetal growth restriction support',
          'Multiple pregnancy (twins/triplets) services',
          'Pregnancy loss and bereavement support',
          'Genetic counselling services',
          'Maternal medical conditions support'
        ]
      },
      {
        icon: 'mdi-baby-face-outline',
        color: 'error',
        title: 'Premature Birth Support',
        description: 'Specialized care and support for premature birth:',
        list: [
          'Prevention and management of preterm labour',
          'Antenatal steroid administration',
          'Premature baby care education',
          'Family support during NICU stay',
          'Post-discharge follow-up care',
          'Developmental support services'
        ]
      },
      {
        icon: 'mdi-hospital-building',
        color: 'secondary',
        title: 'NICU / SCBU Services',
        description: 'Neonatal Intensive Care Unit and Special Care Baby Unit services:',
        list: [
          'Level 1, 2, and 3 neonatal intensive care',
          'Specialized medical equipment and monitoring',
          'Respiratory support and ventilation',
          'Nutritional support and feeding assistance',
          'Family-centered care programs',
          'Transition to home support',
          'Long-term developmental follow-up'
        ]
      }
    ]
  },
  {
    key: 'resources',
    icon: 'mdi-book-open-variant',
    color: 'accent',
    title: 'Additional Resources & Contacts',
    resources: [
      {
        icon: 'mdi-phone',
        color: 'primary',
        title: 'Emergency Contacts',
        subtitle: '24/7 support services',
        content: [
          { label: 'Emergency', value: '111' },
          { label: 'Healthline', value: '0800 611 116' },
          { label: 'Pregnancy support', value: 'Contact your LMC' }
        ]
      },
      {
        icon: 'mdi-web',
        color: 'success',
        title: 'Online Resources',
        subtitle: 'Helpful websites and tools',
        content: [
          { label: 'Ministry of Health', value: 'health.govt.nz' },
          { label: 'Plunket', value: 'plunket.org.nz' },
          { label: 'PMMRC', value: 'pmmrc.health.govt.nz' }
        ]
      }
    ]
  }
]; 