import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';

function tranformDescription(dirty) {
  const sanitized = sanitizeHtml(dirty, {
    allowedTags: [
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'blockquote',
      'ul',
      'ol',
      'li',
      'p',
      'strong',
      'em',
      'u',
      's',
      'code',
    ],
    allowedAttributes: {},
    allowedIframeHostnames: [],
  });

  if (sanitized === '<p></p>') {
    return '';
  }

  return sanitized;
}

export class CreateTaskDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsString()
  @Transform(tranformDescription)
  description: string;

  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsUUID()
  @IsOptional()
  ownerId?: string;
}
