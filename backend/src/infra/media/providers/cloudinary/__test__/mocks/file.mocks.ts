const createFile = (
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File =>
  ({
    fieldname: 'file',
    originalname: 'test.jpg',
    filename: 'test',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('test'),
    ...overrides,
  }) as Express.Multer.File;

export { createFile };
