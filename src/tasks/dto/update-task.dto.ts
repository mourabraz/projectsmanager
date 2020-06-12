import { IsString, IsOptional, IsUUID } from 'class-validator';
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

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title: string;

  @IsString()
  @IsOptional()
  @Transform(tranformDescription)
  description: string;

  @IsString()
  @IsOptional()
  startedAt: string;

  @IsString()
  @IsOptional()
  deadlineAt: string;

  @IsUUID()
  @IsOptional()
  ownerId?: string;
}
