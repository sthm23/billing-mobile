import { BaseListResponse } from '@/models/app.models';
import { Product } from '@/models/product.model';

// export const mockProducts: Product[] = [
//   {
//     id: '1',
//     storeId: 'store-1',
//     warehouseId: 'wh-1',
//     warehouse: {
//       id: 'wh-1',
//       storeId: 'store-1',
//       name: 'Склад',
//       isActive: true,
//       createdAt: '2024-01-01T00:00:00Z',
//     },
//     name: 'Конопка 4м',
//     category: 'Beam',
//     brand: 'Other',
//     isArchived: false,
//     description: 'Сосна Лесвак',
//     createdAt: '2024-01-01T00:00:00Z',
//     priceRange: {
//       min: '60000',
//       max: '75000',
//     },
//     tags: [],
//     images: [],
//     variants: [
//       { id: 'v1', price: 60000, quantity: 12 },
//       { id: 'v2', price: 75000, quantity: 8 },
//     ],
//   },
//   {
//     id: '2',
//     storeId: 'store-1',
//     warehouseId: 'wh-2',
//     warehouse: {
//       id: 'wh-2',
//       storeId: 'store-1',
//       name: "Yog'och",
//       isActive: true,
//       createdAt: '2024-01-01T00:00:00Z',
//     },
//     name: 'Конопка 6м',
//     category: 'Beam',
//     brand: 'Other',
//     isArchived: false,
//     description: null,
//     createdAt: '2024-01-01T00:00:00Z',
//     priceRange: {
//       min: '90000',
//       max: '100000',
//     },
//     tags: [],
//     images: [],
//     variants: [
//       { id: 'v3', price: 90000, quantity: 15 },
//       { id: 'v4', price: 100000, quantity: 5 },
//     ],
//   },
//   {
//     id: '3',
//     storeId: 'store-1',
//     warehouseId: 'wh-1',
//     warehouse: {
//       id: 'wh-1',
//       storeId: 'store-1',
//       name: 'Склад',
//       isActive: true,
//       createdAt: '2024-01-01T00:00:00Z',
//     },
//     name: 'strapela 6m',
//     category: 'Timber',
//     brand: 'Other',
//     isArchived: false,
//     description: 'lesvak',
//     createdAt: '2024-01-01T00:00:00Z',
//     priceRange: {
//       min: '195000',
//       max: '270000',
//     },
//     tags: [],
//     images: [],
//     variants: [
//       { id: 'v5', price: 195000, quantity: 0 },
//       { id: 'v6', price: 270000, quantity: 0 },
//     ],
//   },
//   {
//     id: '4',
//     storeId: 'store-1',
//     warehouseId: 'wh-2',
//     warehouse: {
//       id: 'wh-2',
//       storeId: 'store-1',
//       name: "Yog'och",
//       isActive: true,
//       createdAt: '2024-01-01T00:00:00Z',
//     },
//     name: 'polovoy 4m',
//     category: 'Beam',
//     brand: 'Other',
//     isArchived: false,
//     description: null,
//     createdAt: '2024-01-01T00:00:00Z',
//     priceRange: {
//       min: '30000',
//       max: '35000',
//     },
//     tags: [],
//     images: [],
//     variants: [
//       { id: 'v7', price: 30000, quantity: 1146 },
//       { id: 'v8', price: 35000, quantity: 0 },
//     ],
//   },
//   {
//     id: '5',
//     storeId: 'store-1',
//     warehouseId: 'wh-1',
//     warehouse: {
//       id: 'wh-1',
//       storeId: 'store-1',
//       name: 'Склад',
//       isActive: true,
//       createdAt: '2024-01-01T00:00:00Z',
//     },
//     name: 'reyka 6m',
//     category: 'Batten',
//     brand: 'Other',
//     isArchived: false,
//     description: null,
//     createdAt: '2024-01-01T00:00:00Z',
//     priceRange: {
//       min: '150000',
//       max: '350000',
//     },
//     tags: [],
//     images: [],
//     variants: [
//       { id: 'v9', price: 150000, quantity: 0 },
//       { id: 'v10', price: 350000, quantity: 0 },
//     ],
//   },
// ];

export const mockProductResponse: BaseListResponse<Product> = {
  currentPage: 1,
  pageSize: 10,
  total: 15,
  data: [
    {
      brand: "Other",
      category: "Timber",
      variants: [
        {
          id: "b8a0c832-6b52-4e73-8b65-6e41e526ac74",
          price: 195000,
          quantity: 0
        },
        {
          id: "4a955d0b-7007-4b82-9950-f5acf66479e6",
          price: 230000,
          quantity: 0
        },
        {
          id: "48197023-5452-4bf3-854e-504b9d3cd28f",
          price: 235000,
          quantity: 0
        },
        {
          id: "d1f1b2bf-3e9d-4c71-926b-fff772f82531",
          price: 270000,
          quantity: 0
        }
      ],
      name: "strapela 6m",
      id: "b0e791c9-f937-473c-a496-2da8b8a6b206",
      images: [],
      createdAt: "2026-05-24T03:32:57.231Z",
      warehouseId: "db519574-0142-43f5-a31c-7694867722a4",
      warehouse: {
        id: "db519574-0142-43f5-a31c-7694867722a4",
        storeId: "7849fe6a-afbd-4145-ba4b-b0a32f66cf36",
        name: "yog'och",
        isActive: true,
        createdAt: "2026-05-13T16:30:40.667Z"
      },
      isArchived: false,
      description: "lesvak",
      tags: [],
      priceRange: {
        "min": "195000",
        "max": "270000"
      }
    },
    {
      brand: "Other",
      category: "Beam",
      variants: [
        {
          id: "de497b39-9f7f-4d71-a873-f3cad961500e",
          price: 30000,
          quantity: 1146
        },
        {
          id: "9410a1ab-d10e-4161-be21-c9f8ca334621",
          price: 35000,
          quantity: 0
        }
      ],
      name: "polovoy 4m",
      id: "e6c1d939-686d-4c64-8d84-3a618ff41c9d",
      images: [],
      createdAt: "2026-05-24T03:17:57.253Z",
      warehouseId: "db519574-0142-43f5-a31c-7694867722a4",
      warehouse: {
        id: "db519574-0142-43f5-a31c-7694867722a4",
        storeId: "7849fe6a-afbd-4145-ba4b-b0a32f66cf36",
        name: "yog'och",
        isActive: true,
        createdAt: "2026-05-13T16:30:40.667Z"
      },
    isArchived: false,
    description: null,
    tags: [],
    priceRange: {
       min: "30000",
       max: "35000"
      }
    },
    {
      brand: "Other",
      category: "Beam",
      variants: [
        {
          id: "d5a19464-d653-4712-80d9-589891312cca",
          price: 45000,
          quantity: 185
        },
        {
          id: "1f58069d-9372-4986-991c-82599ab65614",
          price: 75000,
          quantity: 2319
        },
        {
          id: "eaf25e39-91b3-4e3f-886c-a99dd00b1555",
          price: 40000,
          quantity: 3352
        },
        {
          id: "d373c824-1ddd-41cb-8a14-68713d4b115f",
          price: 70000,
          quantity: 0
        },
        {
          id: "4bbb3282-91f8-4017-907f-8a8dcb251765",
          price: 70000,
          quantity: 782
        },
        {
          id: "1da1270e-0268-4284-8146-3326837e83f3",
          price: 55000,
          quantity: 0
        }
      ],
      name: "Kanopka 4m",
      id: "ccb6c8d1-d233-4d64-95bd-a551f0fc9bca",
      images: [],
      createdAt: "2026-05-17T13:01:35.945Z",
      warehouseId: "db519574-0142-43f5-a31c-7694867722a4",
      warehouse: {
        id: "db519574-0142-43f5-a31c-7694867722a4",
        storeId: "7849fe6a-afbd-4145-ba4b-b0a32f66cf36",
        name: "yog'och",
        isActive: true,
        createdAt: "2026-05-13T16:30:40.667Z"
    },      "isArchived": false,
      description: null,
      tags: [],
      priceRange: {
        min: "40000",
        max: "75000"
      }
    },
    {
      brand: "Other",
      category: "Beam",
      variants: [
        {
          id: "ae0862c7-b901-4405-9ecd-8141df1f811f",
          price: 90000,
          quantity: 104
        },
        {
          id: "7a03a1d2-c4b9-435e-ad50-49c9e04c3e85",
          price: 90000,
          quantity: 0
        },
        {
          id: "102f0190-e7b3-4dad-8aa6-84550654f23c",
          price: 85000,
          quantity: 748
        },
        {
          id: "98fa4a7b-1c4f-4be6-84a6-5285262d9f68",
          price: 100000,
          quantity: 0
        }
      ],
      name: "Kanopka 6m",
      id: "56118a67-3d8c-4695-999f-a1ea7d7bd0a7",
      images: [],
      createdAt: "2026-05-17T12:57:51.451Z",
      warehouseId: "db519574-0142-43f5-a31c-7694867722a4",
      warehouse: {
        id: "db519574-0142-43f5-a31c-7694867722a4",
        storeId: "7849fe6a-afbd-4145-ba4b-b0a32f66cf36",
        name: "yog'och",
        isActive: true,
        createdAt: "2026-05-13T16:30:40.667Z"
      },
      isArchived: false,
      description: null,
      tags: [],
      priceRange: {
        min: "85000",
        "max": "100000"
      }
    },
    {
      brand: "Other",
      category: "Beam",
      variants: [
        {
          id: "349717cc-d157-4d4c-ab18-8bc1fe3f9d58",
          price: 300000,
          quantity: 0
        },
        {
          id: "7a9c2a44-0e7b-4a86-a5ae-cd45ae85d4a2",
          price: 250000,
          quantity: 0
        }
      ],
      name: "krugli",
      id: "6c4441db-cd25-4a5a-8a1e-9b191caa74ab",
      images: [],
      createdAt: "2026-05-17T10:24:19.930Z",
      warehouseId: "db519574-0142-43f5-a31c-7694867722a4",
      warehouse: {
        id: "db519574-0142-43f5-a31c-7694867722a4",
        storeId: "7849fe6a-afbd-4145-ba4b-b0a32f66cf36",
        name: "yog'och",
        isActive: true,
        createdAt: "2026-05-13T16:30:40.667Z"
      },
      isArchived: false,
      description: null,
      tags: [],
      priceRange: {
        min: "250000",
        "max": "300000"
      }
    },
    {
      "brand": "Other",
      "category": "Beam",
      "variants": [
        {
          "id": "aa5a2a07-0830-429b-857d-a64b55541338",
          "price": 145000,
          "quantity": 836
        },
        {
          "id": "eb4c58a4-6e22-4c53-a801-29cb2f68173c",
          "price": 90000,
          "quantity": 32
        },
        {
          "id": "2627b1be-85a1-4f33-bb0a-df2764910237",
          "price": 135000,
          "quantity": 0
        },
        {
          "id": "1a3df172-2c47-42e7-8ad4-4740992da0bc",
          "price": 200000,
          "quantity": 438
        },
        {
          "id": "17a9e22b-a68e-4e93-a38d-addbef797bf5",
          "price": 260000,
          "quantity": 0
        },
        {
          "id": "0164613d-83be-426f-8cc8-889798cb80a4",
          "price": 105000,
          "quantity": 1599
        },
        {
          "id": "58a01b03-94af-4463-8027-2d0520ac693c",
          "price": 200000,
          "quantity": 1185
        },
        {
          "id": "4bf47eef-2fc9-47a3-a5b7-264c4e7e0a5b",
          "price": 230000,
          "quantity": 964
        },
        {
          "id": "0240bc1c-6237-4eca-b624-427662fd2028",
          "price": 90000,
          "quantity": 154
        },
        {
          "id": "b5cf0bfa-9712-4fc8-947d-e43774a20121",
          "price": 100000,
          "quantity": 77
        },
        {
          "id": "d25d0d47-0efa-4fdb-951e-23e2ce184fed",
          "price": 220000,
          "quantity": 1394
        },
        {
          "id": "fa5a456f-dfcf-4bd0-a728-ccf3e4a30504",
          "price": 110000,
          "quantity": 7
        },
        {
          "id": "16b090e3-0819-4bcd-a1f6-c6e3b931edfc",
          "price": 155000,
          "quantity": 4477
        },
        {
          "id": "e20239de-9440-48e1-8179-d3a3da468ca9",
          "price": 125000,
          "quantity": 487
        },
        {
          "id": "9cd3f0f0-cea3-470d-ad5a-b451510f2f07",
          "price": 130000,
          "quantity": 0
        },
        {
          "id": "40bb3189-3d42-4a9e-906a-42b4c6343de3",
          "price": 250000,
          "quantity": 77
        },
        {
          "id": "5c987258-0ce5-4040-885d-fdc31f9a2830",
          "price": 185000,
          "quantity": 1500
        },
        {
          "id": "f228d81e-91b1-4936-b276-838b3fd1690d",
          "price": 165000,
          "quantity": 790
        },
        {
          "id": "6dcf5651-13fe-43f2-bc5d-0a75e8f47866",
          "price": 230000,
          "quantity": 0
        },
        {
          "id": "6698da0c-2a68-433c-9b9f-9b907505401e",
          "price": 170000,
          "quantity": 420
        },
        {
          "id": "5489aeb5-b286-4062-a6a2-5b2d6e4aeceb",
          "price": 145000,
          "quantity": 0
        },
        {
          "id": "d5e6cc1a-d739-4d16-b7ae-b29e41226117",
          "price": 400000,
          "quantity": 142
        },
        {
          "id": "2908fbe1-ba6d-42e1-b642-718663993257",
          "price": 130000,
          "quantity": 3819
        }
      ],
      name: "strapela 6m",
      id: "4cbdc5df-017e-47be-a6fd-3f7fd1dc5cff",
      images: [],
      createdAt: "2026-05-17T10:05:33.811Z",
      warehouseId: "db519574-0142-43f5-a31c-7694867722a4",
      warehouse: {
        id: "db519574-0142-43f5-a31c-7694867722a4",
        storeId: "7849fe6a-afbd-4145-ba4b-b0a32f66cf36",
        name: "yog'och",
        isActive: true,
        createdAt: "2026-05-13T16:30:40.667Z"
      },
      isArchived: false,
      description: null,
      tags: [],
      priceRange: {
        "min": "90000",
        "max": "400000"
      }
    },
    {
      brand: "Other",
      category: "Timber",
      variants: [
        {
          id: "f467c7e5-2f24-4897-ae9d-a1039ba16655",
          price: 120000,
          quantity: 326
        },
        {
          id: "2247d4ad-a726-4fd2-9328-dec4296cf61a",
          price: 110000,
          quantity: 4114
        },
        {
          id: "8f7bb2e9-431e-4609-a259-6462e5dc9c61",
          price: 135000,
          quantity: 70
        },
        {
          id: "355988ff-1141-44bd-b2f1-4eba88fa29c6",
          price: 140000,
          quantity: 261
        },
        {
          id: "a8bdc4b1-aef3-46f4-9de5-a3e30647c04e",
          price: 190000,
          quantity: 0
        },
        {
          id: "7ebd16c5-bffa-4358-867b-53881af646b5",
          price: 17000,          quantity: 0
        },
        {
          id: "e7171330-4bbe-4880-9972-6d97bb4c146d",
          price: 95000,
          quantity: 105
        }
      ],
      name: "stropela 4m",
      id: "6b831d61-35e1-49f8-b137-51ff373e618e",
      images: [],
      createdAt: "2026-05-17T10:03:09.346Z",
      warehouseId: "db519574-0142-43f5-a31c-7694867722a4",
      warehouse: {
        id: "db519574-0142-43f5-a31c-7694867722a4",
        storeId: "7849fe6a-afbd-4145-ba4b-b0a32f66cf36",
        name: "yog'och",
        isActive: true,
        createdAt: "2026-05-13T16:30:40.667Z"
      },
      isArchived: false,
      description: "lesvak",
      tags: [],
      priceRange: {
        min: "95000",
        "max": "190000"
      }
    },
    {
      brand: "Other",
      category: "Beam",
      variants: [
        {
          id: "9578963d-ad63-427d-8d1e-93471d6c2381",
          price: 145000,
          quantity: 0
        },
        {
          id: "66876e7a-88ab-4a17-86aa-30ec12e95572",
          price: 75000,
          quantity: 0
        },
        {
          id: "ac4861c2-fc28-43ea-97e9-0c49e8a938d3",
          price: 60000,
          quantity: 0
        },
        {
          id: "91504b29-47cc-4ffe-9898-916c2e07dae5",
          price: 90000,
          quantity: 0
        },
        {
          id: "5aa09fda-f260-441b-acdf-62b8891e1313",
          price: 70000,
          quantity: 0
        },
        {
          id: "c0b2cc63-630f-4e15-81ff-3620277b7d3c",
          price: 70000,
          quantity: 0
        },
        {
          id: "5fa4122d-18a3-4915-9ab8-98642925c7ec",
          price: 110000,
          quantity: 0
        },
        {
          id: "2cdb6d8c-09d8-4e78-8d99-4572a8adf67a",
          price: 90000,
          quantity: 0
        },
        {
          id: "77be36f0-48b2-4d20-9e65-d77ee496509a",
          price: 120000,
          quantity: 0
        },
        {
          id: "bf1e484a-2a04-47c3-8ac4-bd7a855b366e",
          price: 125000,
          quantity: 0
        },
        {
          id: "5e9a88c5-7674-4777-9b91-7ebfcfd620cb",
          price: 200000,
          quantity: 0
        },
        {
          id: "10cea593-6f99-4799-9a88-1e113e413cf0",
          price: 180000,
          quantity: 0
        },
        {
          id: "c7eeceee-bd63-4c26-92b0-bf04fc83cd33",
          price: 90000,
          quantity: 0
        },
        {
          id: "d1a1c601-06b4-4e16-8b4a-8dd8c2966278",
          price: 85000,
          quantity: 0
        },
        {
          id: "73a511b3-ee4d-4d3f-97f8-c185015276e8",
          price: 135000,
          quantity: 0
        }
      ],
      name: "strapela 4m",
      id: "0955b483-8cc9-4bb0-998d-0f3a129e8f8f",
      images: [],
      createdAt: "2026-05-17T09:54:37.783Z",
      warehouseId: "db519574-0142-43f5-a31c-7694867722a4",
      warehouse: {
        id: "db519574-0142-43f5-a31c-7694867722a4",
        storeId: "7849fe6a-afbd-4145-ba4b-b0a32f66cf36",
        name: "yog'och",
        isActive: true,
        createdAt: "2026-05-13T16:30:40.667Z"
      },
      isArchived: false,
      description: null,
      tags: [],
      priceRange: {
        min: "60000",
        "max": "200000"
      }
    },
    {
      brand: "Other",
      category: "Beam",
      variants: [
        {
          id: "c350df2d-8c0b-4cfd-a292-55f2fdc8e221",
          price: 100000,
          quantity: 5
        },
        {
          id: "badd7cc1-ef2c-4fdc-aa51-92572760cafc",
          price: 50000,
          quantity: 1570
        },
        {
          id: "1793587e-46af-4310-b9ad-57f59a0d4712",
          price: 60000,
          quantity: 1419
        },
        {
          id: "e04b9a42-be17-40d7-9a14-82e6db940aa8",
          price: 90000,
          quantity: 112
        },
        {
          id: "6485ae6d-31f4-4097-80b3-04159f6e1339",
          price: 60000,
          quantity: 1436
        },
        {
          id: "c7b52406-9b88-453a-9675-633f4c8516de",
          price: 45000,
          quantity: 4260
        },
        {
          id: "4e7d142d-ab51-4853-b28f-396cfe486541",
          price: 35000,
          quantity: 6036
        },
        {
          id: "1eba96cc-7cdd-46b1-a34d-c0978e54b1be",
          price: 110000,
          quantity: 15
        },
        {
          id: "6faf74ce-425c-47d2-b422-d297f1e03f99",
          price: 60000,
          quantity: 0
        },
        {
          id: "35f30f3c-2644-47a1-9b9a-9db221a6e71d",
          price: 80000,
          quantity: 2088
        },
        {
          id: "fc0db3ef-48d0-4605-be48-74b24acf4972",
          price: 95000,
          quantity: 0
        },
        {
          id: "81ab9f56-ebb9-4f72-bda0-94c2dbf32187",
          price: 40000,
          quantity: 0
        },
        {
          id: "cb04239f-f89e-4a6d-bfa6-0ad845ecb1eb",
          price: 40000,
          quantity: 0
        }
      ],
      name: "polovoy 6m",
      id: "0d500651-635b-4973-8311-ca1fdc003e23",
      images: [],
      createdAt: "2026-05-17T09:47:56.224Z",
      warehouseId: "db519574-0142-43f5-a31c-7694867722a4",
      warehouse: {
        id: "db519574-0142-43f5-a31c-7694867722a4",
        storeId: "7849fe6a-afbd-4145-ba4b-b0a32f66cf36",
        name: "yog'och",
        isActive: true,
        createdAt: "2026-05-13T16:30:40.667Z"
      },
      isArchived: false,
      description: null,
      tags: [],
      priceRange: {
        min: "35000",
        "max": "110000"
      }
    },
    {
      brand: "Other",
      category: "Batten",
      storeId: "Batten",
      variants: [
        {
          id: "8f9fc551-7433-472b-bc45-6e32c2486860",
          price: 150000,
          quantity: 0
        },
        {
          id: "3bd4a1b8-5a3a-40ca-b1b4-bee55754c6e8",
          price: 350000,
          quantity: 0
        },
        {
          id: "cd56a605-895e-45df-8a2c-64c8f50eb10d",
          price: 320000,
          quantity: 0
        },
        {
          id: "85d0ccc3-d190-4bc8-b252-236efc5d73eb",
          price: 300000,
          quantity: 0
        }
      ],
      name: "reyka 6m",
      id: "dae5e6d1-d165-4c80-8a47-cb1b6a5af565",
      images: [],
      createdAt: "2026-05-17T09:45:46.217Z",
      warehouseId: "db519574-0142-43f5-a31c-7694867722a4",
      warehouse: {
        id: "db519574-0142-43f5-a31c-7694867722a4",
        storeId: "7849fe6a-afbd-4145-ba4b-b0a32f66cf36",
        name: "yog'och",
        isActive: true,
        createdAt: "2026-05-13T16:30:40.667Z"
      },
      isArchived: false,
      description: null,
      tags: [],
      priceRange: {
        min: "150000",
        max: "350000"
      }
    }
  ]
}
