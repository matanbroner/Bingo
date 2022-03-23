const launchClients = require("./launchClients");

const userIds = [
  "ba9a2c6e-b842-47f6-bc2e-fdb7bc2820f8",
  "4254c2e8-c180-4f36-882b-ff8d1767f5cd",
  "5d92e7f3-119f-4ca8-bca3-ff8e94af91bb",
  "1c40be1f-3309-484e-88ec-ea4e00e1d0bf",
  "01f39054-2bc8-4114-99b7-12705dd3e9b7",
  "bc2e9295-1752-40cd-9b2f-44e8263bd5b7",
  "8bccb45f-cbc8-4d00-b6b5-8e4c014a28e7",
  "78c93174-ccda-4483-bcee-57a2ca715925",
  "91e5ef7c-0f33-4da9-b556-08b2861fbe4d",
  "7a1324a7-4c72-48b7-9778-9d38c11a9489",
  "c8c2e009-05d6-4dd0-8830-6b288dd34294",
  "176449b4-bb2a-4f1c-b27f-5126a79d7ca6",
  "1e832d7c-ebb8-49a4-92af-e62ea6a971e7",
  "bb545b22-4bd1-4743-b93b-6d1d9a1451d5",
  "8f2b6916-3e01-475b-a357-d0ce5035bb42",
  "ccf58812-8ef9-4a61-827e-2ead37b48ed8",
  "b8a60c40-2833-4aa0-a0c6-1907e4fdf144",
  "868b63b7-8958-4525-919c-5e45da12d3ca",
  "91893822-f3f6-4f05-b960-db30595829e7",
  "424c00fd-2c5d-4c69-9b9c-3da57353b46a",
  "96d0dc7d-99f1-46e0-b9ee-69380b877199",
  "a51f92a1-8101-4dff-8a44-e1af8b77e8ef",
  "ca878688-4919-4b13-8004-61b3bd0c268b",
  "b8a64ef9-e576-4252-adf0-dc93da3e3ef9",
  "fce426ac-a506-4a15-b773-0a079ffaf331",
  "b5e3a71e-7580-4897-93cc-0977ac2799ba",
  "68883e55-4b5a-402c-bf7f-546a3ae504c3",
  "92cd36ee-d04f-4c94-ac1e-4014f98d6923",
  "cfd47fdc-8b4c-4502-bd20-c41d56365d17",
  "0e7ba232-963b-4081-b839-39420dda9f07",
  "973707a9-551a-4999-80d6-3ec6bbcd7e91",
  "92ceea3b-93e8-4631-8fa6-f9d2a4badbbf",
  "b2b46139-c758-4947-8683-d4afa24aa105",
  "0cb82b9c-b554-40e0-ba53-b995143fa32b",
  "db19292d-b762-49e3-a07b-fc68939508b3",
  "929dc1ee-232a-4890-b226-db6c2bb6c6d0",
  "3bd1e665-41f0-456e-bc8e-80ce7c384e34",
  "5d389c0e-b170-4573-a454-151c1a27b66f",
  "a2f2b305-17b9-419b-a290-c028c0fc27b4",
  "b7be24a7-3983-4f1f-aa3b-46230361c5d7",
  "869f902b-d0b6-466c-81d9-13130e8b42dd",
  "984c7fa5-c375-439f-afd8-5fa848740df5",
  "6795693d-3388-48cc-9440-a4240678eff5",
  "f59e6dc5-f313-40da-bea3-928715c2c2f7",
  "4fd7b7f9-8503-456a-87cc-6f621f105d40",
  "c0ef8f46-8bb0-4a7c-a86c-09ff9178f96b",
  "09e197e4-82d0-483f-be19-2d59cc7b3586",
  "b1916b83-b852-431d-81d7-6dfffda5906c",
  "d58edc7b-d481-485e-8afe-14f4f3537de9",
  "0523a4be-db75-4951-a06a-eaf92250ca41",
  "178b1d6c-62ae-4b5a-8250-7818d72c98a3",
  "a57e33be-dd9d-4983-bd8a-84fa80d75948",
  "2331d6e8-798e-4d8d-a6db-fc2fca7d9bcf",
  "f6e8b500-6502-46f0-8869-f31c10744460",
  "10ac32fb-fce3-466f-8376-4a3473afa99d",
  "c2a1ad10-4e05-4e42-830b-b3b33a3fc5a3",
  "28ef3748-726b-4058-8244-9ffcd92c9503",
  "6141f3df-5269-49d8-bfb2-689ce024e4eb",
  "37d53d76-e3ff-4c66-b862-be65933c0eab",
  "c68ae5aa-8599-44b7-91e8-72041c225309",
  "fb2e8857-dec1-4504-a5b4-c8112a7f18f5",
  "84d6092e-e3c1-497a-8f47-4baf07ed7992",
  "6abd6ed5-8788-4abf-a6a0-0a8530d69c44",
  "a53c72f4-c5c6-4dda-9ed5-dd9e7afc5747",
  "47bfe128-c712-473f-a165-86ffb4ca25ad",
  "7a1b6e8b-169c-4c70-af38-f3d991362eef",
  "fe7e6113-d2bf-431b-ac4c-b3fabe916649",
  "c9ed41fc-dba0-4136-b1d5-4967ad740514",
  "bd768b10-e6a9-440d-b658-985488f0279d",
  "35f7ef56-72b6-447a-9004-ed35d52ad362",
  "487251f6-ddd1-4941-8388-883b8878617a",
  "57759e51-c22c-4fc0-80a9-ad4b3941ef5d",
  "93c3d61f-ee89-4cd5-b1cc-bd3f0b40a8c0",
  "834020f3-7a54-4cc3-a273-5909908a5172",
  "c5592de5-1bcb-4118-81ce-43b11809fd3d",
  "8bfd18fc-a916-43cf-a0ff-0e70f3ef777d",
  "495ae775-bfde-4972-88c6-8a0257f6ac75",
  "495cb342-f170-41e8-bd06-2c74d19ebd28",
  "cd856126-4024-4537-9ad3-1eccf036e0f7",
  "425e250c-c8d0-4e3e-a850-60e610e8f0b1",
  "84ef2a98-5013-4ebb-adc5-72233220f54c",
  "ebe4a92d-0bd2-4684-a46f-bbea16e7ac5c",
  "f77f42c0-a531-43e0-b55b-f6c1107360f0",
  "a57314ea-023d-4db9-acd5-1fb6e739e6ea",
  "f9400651-f741-470a-b92a-ac34c4cf2fdf",
  "950f52bc-0862-4bfe-8ce0-bfe6f3003488",
  "f746e452-0959-4d7b-85cb-549149b87675",
  "fa6e2d0b-68cd-463d-9b04-d6f5328b6be5",
  "e365db98-de6c-414a-b676-20bb682a2643",
  "193fc7f2-d207-4a43-a806-a2b07e1ed7f1",
  "a8dec570-969b-4e00-aa0f-22039af23e21",
  "70a4f579-e7ac-41a7-95de-c4b072cd5857",
  "29d4168c-db58-4878-a490-8e7be4ad3cd5",
  "160b3597-56b3-44cd-85d3-ae717bd875d0",
  "754902d6-ab42-4ffa-b5cd-c033e6fdc06e",
  "2927edc9-8da4-47a2-8f96-200e0e44a674",
  "65ae9d32-54d2-41f2-b54a-69d3b245e53b",
  "6f3f268a-4e8f-48b6-ac8f-9ff72e478098",
  "7cbcb1df-e07d-477f-b5a5-968fb692161f",
  "91f29ab1-4b61-42e1-b3c5-bbe39cb54112",
];

launchClients(userIds);
