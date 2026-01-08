<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReviewHelpfulVote extends Model
{
    protected $fillable = ['review_id', 'user_id'];
}
